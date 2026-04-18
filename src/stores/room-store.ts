import { create } from 'zustand';
import { RoomStore, RoomWithDetails, RoomPresence, RoomState, MessageWithUser } from '@/types';
import { 
  supabase, 
  getRoomById, 
  updateRoomState, 
  sendMessage, 
  getMessages,
  updatePresence,
  leaveRoom 
} from '@/lib/supabase';

export const useRoomStore = create<RoomStore>((set, get) => ({
  room: null,
  presence: [],
  state: null,
  messages: [],
  isConnected: false,
  loading: false,
  error: null,
  pollingInterval: null,

  setRoom: (room: RoomWithDetails | null) => set({ room }),
  
  setLoading: (loading: boolean) => set({ loading }),
  
  setError: (error: string | null) => set({ error }),

  loadRoom: async (roomId: string) => {
    console.log('RoomStore - Loading room:', roomId);
    set({ loading: true, error: null });
    try {
      const room = await getRoomById(roomId);
      console.log('RoomStore - Room loaded:', room);
      const messages = await getMessages(roomId);
      console.log('RoomStore - Messages loaded:', messages);
      
      set({ 
        room, 
        messages: messages || [], 
        loading: false 
      });
      
      // Temporarily disable real-time due to callback order issues
      // get().setupRealtime(roomId);
      
      // Use polling as primary method for now
      get().startMessagePolling(roomId);
      console.log('RoomStore - Using polling for message updates (real-time temporarily disabled)');
      
      // Update presence
      // await updatePresence(roomId, true);
    } catch (error) {
      console.error('RoomStore - Error loading room:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load room', 
        loading: false 
      });
    }
  },

  setupRealtime: async (roomId: string) => {
    console.log('RoomStore - Setting up realtime for room:', roomId);
    
    try {
      // Check if we already have a connection for this room
      const { isConnected } = get();
      if (isConnected) {
        console.log('RoomStore - Already connected, skipping setup');
        return;
      }
      
      // Create channel with minimal config
      const messageChannel = supabase.channel(`messages-${roomId}`);
      
      console.log('RoomStore - Channel created, adding postgres_changes callback');
      
      // Add postgres_changes callback
      messageChannel.on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `room_id=eq.${roomId}`
        },
        async (payload: any) => {
          console.log('RoomStore - New message received instantly:', payload);
          const newMessage = payload.new as MessageWithUser;
          
          // Fetch user data for the message
          try {
            const { data: userData } = await supabase
              .from('users')
              .select('id, name, email')
              .eq('id', newMessage.user_id)
              .single();
            
            const messageWithUser = {
              ...newMessage,
              user: userData || {
                id: newMessage.user_id,
                name: 'Unknown User',
                email: '',
                approved: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            };
            
            // Instant update - no delay
            set(state => ({
              messages: [...state.messages, messageWithUser]
            }));
          } catch (error) {
            console.error('Error fetching user data for message:', error);
          }
        }
      );

      console.log('RoomStore - Callback added, now subscribing');
      
      // Subscribe to message channel
      const subscription = await messageChannel.subscribe((status: any) => {
        console.log('RoomStore - Message channel subscription status:', status);
        if (status === 'SUBSCRIBED') {
          set({ isConnected: true });
          console.log('RoomStore - Realtime connection established');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('RoomStore - Channel error, falling back to polling');
          set({ isConnected: false });
        }
      });

      return () => {
        console.log('RoomStore - Cleaning up realtime subscription');
        messageChannel.unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up realtime:', error);
      // Don't set error state, just log it and continue without realtime
      console.warn('RoomStore - Continuing without real-time updates');
      set({ isConnected: false });
    }
  },

  startMessagePolling: (roomId: string) => {
    // Clear any existing polling
    get().stopMessagePolling();
    
    // Poll every 5 seconds for new messages (fallback when realtime fails)
    const interval = setInterval(async () => {
      try {
        const { messages: currentMessages } = get();
        const newMessages = await getMessages(roomId);
        
        if (newMessages && newMessages.length > currentMessages.length) {
          console.log('RoomStore - Polling found new messages:', newMessages.length - currentMessages.length);
          set({ messages: newMessages });
        }
      } catch (error) {
        console.error('RoomStore - Error polling messages:', error);
      }
    }, 5000);
    
    set({ pollingInterval: interval });
    console.log('RoomStore - Started message polling for room:', roomId);
  },

  stopMessagePolling: () => {
    const { pollingInterval } = get();
    if (pollingInterval) {
      clearInterval(pollingInterval);
      set({ pollingInterval: null });
      console.log('RoomStore - Stopped message polling');
    }
  },

  sendMessage: async (message: string) => {
    const { room } = get();
    if (!room) throw new Error('No room found');

    try {
      // Import the sendMessage function from supabase to avoid naming conflict
      const { sendMessage: sendSupabaseMessage } = await import('@/lib/supabase');
      const newMessage = await sendSupabaseMessage(room.id, message);
      console.log('RoomStore - Adding message to local state:', newMessage);
      
      // Ensure proper message structure with user data
      const messageWithUser = {
        ...newMessage,
        user: {
          id: newMessage.user_id,
          name: 'User',
          email: ''
        }
      };
      
      // Add the new message to the local messages array
      set(state => ({
        messages: [...state.messages, messageWithUser]
      }));
      return messageWithUser;
    } catch (error) {
      console.error('RoomStore - Error sending message:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to send message' });
      throw error;
    }
  },

  updateRoomState: async (updates: Partial<RoomState>) => {
    const { room, state } = get();
    if (!room) return;

    try {
      const newState = await updateRoomState(room.id, {
        playing: updates.playing ?? state?.playing ?? false,
        current_time: updates.video_time ?? state?.video_time ?? 0,
        playback_rate: updates.playback_rate ?? state?.playback_rate ?? 1.0,
      });
      
      set({ state: newState });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update room state' });
    }
  },

  
  leaveRoom: async () => {
    const { room } = get();
    if (!room) return;

    try {
      // Stop polling
      get().stopMessagePolling();
      
      await leaveRoom(room.id);
      set({ 
        room: null, 
        presence: [], 
        state: null, 
        messages: [], 
        isConnected: false,
        pollingInterval: null
      });
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  },

  clearError: () => set({ error: null }),
}));
