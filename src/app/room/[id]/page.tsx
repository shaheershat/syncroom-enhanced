'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useRoomStore } from '@/stores/room-store';
import { supabase } from '@/lib/supabase';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  SkipForward, 
  SkipBack,
  Settings,
  MessageSquare,
  Users,
  LogOut,
  X
} from 'lucide-react';
import { ConfirmationModal } from '@/components/confirmation-modal';
import { ChatPanel } from '@/components/chat-panel';
import { VideoPlayer } from '@/components/video-player';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { 
    room, 
    state, 
    messages, 
    presence, 
    loading, 
    error, 
    loadRoom, 
    updateRoomState, 
    leaveRoom 
  } = useRoomStore();
  
  const [showChat, setShowChat] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingAction, setPendingAction] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const roomId = Array.isArray(params.id) ? params.id[0] : params.id;
    console.log('RoomPage - Loading room:', roomId);
    if (roomId) {
      loadRoom(roomId);
    }
    
    return () => {
      leaveRoom();
    };
  }, [params.id]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Listen for resize events
    window.addEventListener('resize', checkMobile);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    if (!showChat) {
      screen.orientation?.lock?.('landscape').catch(() => {});
    } else {
      screen.orientation?.unlock?.();
    }
  }, [showChat, isMobile]);

  const handleVideoAction = (action: string, payload?: any) => {
    setPendingAction({ type: action, payload });
    setShowConfirmation(true);
  };

  const confirmAction = async () => {
    if (!pendingAction || !state) return;

    try {
      switch (pendingAction.type) {
        case 'play':
          await updateRoomState({ playing: true });
          break;
        case 'pause':
          await updateRoomState({ playing: false });
          break;
        case 'seek':
          await updateRoomState({ video_time: pendingAction.payload });
          break;
        case 'skip_forward':
          await updateRoomState({ video_time: state.video_time + 10 });
          break;
        case 'skip_backward':
          await updateRoomState({ video_time: Math.max(0, state.video_time - 10) });
          break;
        case 'speed_change':
          await updateRoomState({ playback_rate: pendingAction.payload });
          break;
      }
    } catch (error) {
      console.error('Error updating room state:', error);
    }

    setShowConfirmation(false);
    setPendingAction(null);
  };

  const handleLeaveRoom = async () => {
    await leaveRoom();
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading room...</div>
      </div>
    );
  }

  // Add logging for room data
  console.log('RoomPage - Complete room data:', room);
  console.log('RoomPage - Room.video:', room?.video);

  if (error || !room) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">{error || 'Room not found'}</div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const otherUser = room.creator.id === user?.id ? room.invited_user : room.creator;
  const isOnline = presence.some(p => p.user_id === otherUser.id && p.online);

  return (
    <div className={`min-h-screen bg-slate-900 ${isFullscreen ? 'overflow-hidden' : ''}`}>
      {/* Header */}
      <header className={`bg-black/50 backdrop-blur-lg border-b border-white/10 ${isFullscreen ? 'absolute top-0 left-0 right-0 z-50' : ''}`}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-4">
            <h1 className="text-white font-semibold">{room.video.title}</h1>
            <div className="flex items-center space-x-2 text-sm">
              <Users className="w-4 h-4 text-gray-400" />
              <span className={`flex items-center space-x-1 ${isOnline ? 'text-green-400' : 'text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
                <span>{otherUser.name}</span>
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowChat(!showChat)}
              className={`p-2 rounded-lg transition-colors ${
                showChat ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            <button
              onClick={handleLeaveRoom}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className={`${isMobile ? 'flex flex-col' : 'flex'} ${isFullscreen ? 'h-screen' : 'h-[calc(100vh-60px)]'}`}>
        {/* Video Section */}
        <div className={`${isMobile ? 'flex-1' : 'flex-1 relative'}`}>
          <VideoPlayer
            ref={videoRef}
            videoUrl={room.video?.video_url || ''}
            state={state}
            onAction={handleVideoAction}
            isFullscreen={isFullscreen}
            room={room}
          />
        </div>

        {/* Chat Section - Mobile: Below video, Desktop: Sidebar */}
        {showChat && !isFullscreen && (
          <div className={`${isMobile ? 'w-full h-96 border-t border-white/10' : 'w-80 border-l border-white/10'} bg-slate-800 flex flex-col`}>
            <ChatPanel roomId={room.id} messages={messages} />
          </div>
        )}

        {/* Chat Overlay for Fullscreen - Desktop */}
        {showChat && isFullscreen && !isMobile && (
          <div className="fixed top-16 right-4 w-80 h-[70vh] z-50 bg-slate-800 rounded-lg overflow-hidden border border-white/10 flex flex-col">
            <ChatPanel roomId={room.id} messages={messages} />
          </div>
        )}

        {/* Chat Overlay for Fullscreen - Mobile landscape */}
        {showChat && isFullscreen && isMobile && (
          <div className="fixed top-16 left-0 right-0 h-64 z-50 bg-slate-800 border-b border-white/10 overflow-hidden flex flex-col">
            <ChatPanel roomId={room.id} messages={messages} />
          </div>
        )}
      </div>

      {/* Overlay Chat (when chat is closed) - Mobile only */}
      {!showChat && isMobile && (
        <div className="fixed bottom-4 left-4 right-4 max-w-md z-40">
          <ChatPanel
            roomId={room.id}
            messages={messages.slice(-3)}
            overlay={true}
          />
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        action={pendingAction}
        onConfirm={confirmAction}
        onCancel={() => {
          setShowConfirmation(false);
          setPendingAction(null);
        }}
      />
    </div>
  );
}
