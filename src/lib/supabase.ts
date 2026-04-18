import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

let _client: ReturnType<typeof createClient<Database>> | null = null;

const getClient = () => {
  if (!_client) {
    _client = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }
    );
  }
  return _client;
};

// Proxy defers client creation until first property access (safe during SSR/build)
export const supabase: any = new Proxy(
  {} as any,
  { get: (_, prop) => (getClient() as any)[prop as string] }
);

// Realtime channel utilities
export const createRoomChannel = async (roomId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  return supabase.channel(`room-${roomId}`, {
    config: {
      broadcast: { self: true },
      presence: { key: user?.id || 'anonymous' },
    },
  });
};

export const subscribeToRoomState = (roomId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`room-state-${roomId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'room_state',
        filter: `room_id=eq.${roomId}`,
      },
      callback
    )
    .subscribe();
};

export const subscribeToMessages = (roomId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`messages-${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`,
      },
      callback
    )
    .subscribe();
};

export const subscribeToPresence = (roomId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`presence-${roomId}`)
    .on('broadcast', { event: 'presence' }, callback)
    .subscribe();
};

// Database helpers
export const getCurrentUser = async () => {
  // Use localStorage instead of Supabase Auth
  const simpleUser = localStorage.getItem('currentUser');
  if (!simpleUser) return null;
  
  try {
    return JSON.parse(simpleUser);
  } catch {
    return null;
  }
};

export const isUserApproved = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('approved')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data?.approved || false;
};

export const createRoom = async (data: { invited_user_id: string; video_id: string }) => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data: room, error } = await supabase
    .from('rooms')
    .insert({
      created_by: user.id,
      ...data,
    })
    .select(`
      *,
      creator:created_by(id, name, email),
      invited_user:invited_user_id(id, name, email),
      video:video_id(id, title, cloudinary_url, thumbnail, duration)
    `)
    .single();

  if (error) throw error;
  return room;
};

export const getRoomById = async (roomId: string) => {
  // Get basic room data
  const { data: roomData, error: roomError } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single();

  if (roomError) throw roomError;
  if (!roomData) throw new Error('Room not found');

  // Get video data separately
  const { data: videoData } = await supabase
    .from('videos')
    .select('*')
    .eq('id', roomData.video_id)
    .single();

  // Get user data separately
  const { data: creatorData } = await supabase
    .from('users')
    .select('*')
    .eq('id', roomData.created_by)
    .single();

  const { data: invitedUserData } = await supabase
    .from('users')
    .select('*')
    .eq('id', roomData.invited_user_id)
    .single();

  // Video URL is stored directly in the database (external URLs like Google Drive)
  console.log('getRoomById - videoData:', videoData);
  const videoWithUrl = videoData ? {
    ...videoData,
    video_url: videoData.video_url || ''
  } : { title: 'Unknown Video', video_url: '' };
  
  console.log('getRoomById - videoWithUrl:', videoWithUrl);

  // Manually construct room with relationships
  return {
    ...roomData,
    video: videoWithUrl,
    creator: creatorData || { name: 'Unknown User' },
    invited_user: invitedUserData || { name: 'Unknown User' }
  };
};

export const updateRoomState = async (roomId: string, state: {
  playing: boolean;
  current_time: number;
  playback_rate: 0.5 | 1.0 | 1.5 | 2.0 | 3.0;
}) => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('room_state')
    .upsert({
      room_id: roomId,
      playing: state.playing,
      video_time: state.current_time,
      playback_rate: state.playback_rate,
      updated_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const sendMessage = async (roomId: string, message: string) => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  console.log('Supabase - Sending message:', { roomId, userId: user.id, message });

  const { data, error } = await supabase
    .from('messages')
    .insert({
      room_id: roomId,
      user_id: user.id,
      message,
    })
    .select()
    .single();

  if (error) {
    console.error('Supabase - Message insert error:', error);
    throw error;
  }

  console.log('Supabase - Message sent successfully:', data);

  // Manually add user data
  const messageWithUser = {
    ...data,
    user: {
      id: user.id,
      name: user.name,
      email: user.email || ''
    }
  };

  return messageWithUser;
};

export const getMessages = async (roomId: string) => {
  // Get basic messages
  const { data: messagesData, error: messagesError } = await supabase
    .from('messages')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true });

  if (messagesError) throw messagesError;

  // Get user data for all messages
  const userIds = [...new Set(messagesData?.map((m: any) => m.user_id) || [])];
  
  if (userIds.length === 0) return messagesData || [];

  const { data: usersData } = await supabase
    .from('users')
    .select('*')
    .in('id', userIds);

  // Manually join user data
  return (messagesData || []).map((message: any) => ({
    ...message,
    user: usersData?.find((u: any) => u.id === message.user_id) || { name: 'Unknown User' }
  }));
};

export const getVideos = async () => {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .order('title', { ascending: true });

  if (error) throw error;
  
  // Video URLs are stored directly in the database (external URLs)
  const videosWithUrls = data?.map((video: any) => ({
    ...video,
    video_url: video.video_url || '',
    thumbnail_url: video.thumbnail_url || null
  })) || [];

  return videosWithUrls;
};

export const getApprovedUsers = async (): Promise<any[]> => {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('approved', true)
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
};

export const updatePresence = async (roomId: string, online: boolean = true): Promise<void> => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('room_presence')
    .upsert({
      room_id: roomId,
      user_id: user.id,
      online,
    });

  if (error) throw error;
};

export const leaveRoom = async (roomId: string) => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('room_presence')
    .delete()
    .eq('room_id', roomId)
    .eq('user_id', user.id);

  if (error) throw error;
};
