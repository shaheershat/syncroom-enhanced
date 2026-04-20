'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Users, Film, LogOut, Clock, User, Trash2 } from 'lucide-react';
import { User as UserType, Video, RoomWithDetails } from '@/types';
import VideoManager from '@/components/video-manager';

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [activeRooms, setActiveRooms] = useState<RoomWithDetails[]>([]);
  const [alignedRooms, setAlignedRooms] = useState<RoomWithDetails[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<UserType[]>([]);
  const [videos, setVideos] = useState<(Video & { video_url?: string; thumbnail_url?: string })[]>([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showVideoUpload, setShowVideoUpload] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedVideo, setSelectedVideo] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Check for session expiry first
    const expiry = localStorage.getItem('sessionExpiry');
    if (expiry && new Date() >= new Date(expiry)) {
      console.log('Session expired, redirecting to login');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('sessionExpiry');
      router.push('/login');
      return;
    }

    // Check for simple auth user
    const simpleUser = localStorage.getItem('currentUser');
    if (simpleUser) {
      const userData = JSON.parse(simpleUser);
      console.log('Dashboard loaded with user:', userData);
      setCurrentUser(userData);
      
      const loadData = async () => {
        try {
          const [roomsRes, videosRes, usersRes] = await Promise.all([
            fetch(`/api/data/rooms?userId=${userData.id}`).then(r => r.json()),
            fetch('/api/data/videos').then(r => r.json()),
            fetch('/api/data/users').then(r => r.json()),
          ])
          const roomsData = roomsRes.created || []
          const alignedRoomsData = roomsRes.invited || []
          const videosData = videosRes.videos || []
          const usersData = (usersRes.users || []).filter((u: any) => u.id !== userData.id)

          // Manually join video data with proper typing
          const roomsWithVideo = (roomsData || []).map((room: any) => {
            const video = videosData?.find((v: any) => v.id === room.video_id);
            const invitedUser = usersData?.find((u: any) => u.id === room.invited_user_id);
            return {
              ...room,
              video: video || { title: 'Unknown Video', video_url: '' },
              invited_user: invitedUser || { name: 'Unknown User' }
            };
          });

          // Process aligned rooms (rooms where user is invited)
          const alignedRoomsWithVideo = (alignedRoomsData || []).map((room: any) => {
            const video = videosData?.find((v: any) => v.id === room.video_id);
            const creator = usersData?.find((u: any) => u.id === room.created_by);
            return {
              ...room,
              video: video || { title: 'Unknown Video', video_url: '' },
              creator: creator || { name: 'Unknown User' }
            };
          });

          console.log('Rooms with video data:', roomsWithVideo);
          console.log('Aligned rooms with video data:', alignedRoomsWithVideo);
          setActiveRooms(roomsWithVideo);
          setAlignedRooms(alignedRoomsWithVideo);
          setVideos(videosData || []);
          setApprovedUsers(usersData || []);
        } catch (error) {
          console.error('Error loading dashboard data:', error);
        }
      };

      loadData();
    } else {
      console.log('No user found, redirecting to login');
      router.push('/login');
    }
  }, []);

  // Set session expiry for 2 days
const setSessionExpiry = () => {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 2);
  localStorage.setItem('sessionExpiry', expiry.toISOString());
};

// Check if session is still valid
const isSessionValid = () => {
  const expiry = localStorage.getItem('sessionExpiry');
  if (!expiry) return false;
  return new Date() < new Date(expiry);
};

  const handleDeleteRoom = async (roomId: string) => {
    try {
      console.log('Deleting room:', roomId);
      
      await fetch(`/api/data/rooms?roomId=${roomId}`, { method: 'DELETE' });
      
      // Update local state
      setActiveRooms(prev => prev.filter(room => room.id !== roomId));
      
      console.log('Room deleted successfully');
    } catch (error) {
      console.error('Error deleting room:', error);
    }
  };

  const handleCreateRoom = async () => {
    if (!selectedUser || !selectedVideo) {
      console.log('Missing user or video:', { selectedUser, selectedVideo });
      return;
    }
    
    console.log('Creating room with:', {
      currentUser: currentUser?.id,
      selectedUser,
      selectedVideo
    });
    
    setLoading(true);
    try {
      const res = await fetch('/api/data/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          created_by: currentUser.id,
          invited_user_id: selectedUser,
          video_id: selectedVideo,
          status: 'active',
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      const data = json.room;
      if (!data) throw new Error('Failed to create room');

      console.log('Room created successfully:', data);
      
      // Manually add video and user data to the room with proper typing
      const video = videos.find((v: any) => v.id === (data as any).video_id);
      const invitedUser = approvedUsers.find((u: any) => u.id === (data as any).invited_user_id);
      
      const roomWithData = {
        ...(data as any),
        video: video || { title: 'Unknown Video', video_url: '' },
        invited_user: invitedUser || { name: 'Unknown User' }
      };
      
      setActiveRooms([...activeRooms, roomWithData]);
      setShowCreateRoom(false);
      router.push(`/room/${data.id}`);
    } catch (error) {
      console.error('Error creating room:', error);
      alert(`Failed to create room: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUploaded = async (video: Video) => {
    const res = await fetch('/api/data/videos').then(r => r.json());
    setVideos(res.videos || []);
    setShowVideoUpload(false);
  };

  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Film className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-xl font-bold text-white">SyncRoom</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-300">
                Welcome, <span className="font-medium text-white">{currentUser?.name}</span>
              </div>
              <div className="text-xs text-gray-400">
                Session: 2 days
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Welcome back, {currentUser?.name}!
          </h2>
          <p className="text-gray-300">
            Create a room and start watching together with your friends.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mb-8 flex items-center space-x-4">
          <button
            onClick={() => setShowCreateRoom(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            <span>Create New Room</span>
          </button>
          
          <button
            onClick={() => setShowVideoUpload(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-teal-700 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Film className="w-5 h-5" />
            <span>Upload Video</span>
          </button>
        </div>

        {/* Active Rooms */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Active Rooms
          </h3>
          {activeRooms.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-lg rounded-lg p-8 text-center border border-white/10">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300">No active rooms</p>
              <p className="text-sm text-gray-400 mt-2">Create a room to start watching together</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeRooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-white/5 backdrop-blur-lg rounded-lg p-4 border border-white/10 hover:border-purple-500/50 transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 
                      className="font-medium text-white cursor-pointer hover:text-purple-400"
                      onClick={() => router.push(`/room/${room.id}`)}
                    >
                      {room.video.title}
                    </h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRoom(room.id);
                      }}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      title="Delete room"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">
                    With {room.invited_user.name}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{room.status}</span>
                    <span>{new Date(room.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      {/* Aligned Rooms */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Rooms Shared With You
        </h3>
        {alignedRooms.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-lg rounded-lg p-8 text-center border border-white/10">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300">No shared rooms</p>
            <p className="text-sm text-gray-400 mt-2">Wait for others to invite you to watch together</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alignedRooms.map((room) => (
              <div
                key={room.id}
                className="bg-white/5 backdrop-blur-lg rounded-lg p-4 border border-white/10 hover:border-purple-500/50 transition-all cursor-pointer"
                onClick={() => router.push(`/room/${room.id}`)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-white">
                    {room.video.title}
                  </h4>
                  <div className="text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded">
                    Shared
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-2">
                  Created by {room.creator.name}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{room.status}</span>
                  <span>{new Date(room.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateRoom && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-6">Create New Room</h3>
            
            {/* Select User */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Invite User
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                {approvedUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUser(u.id)}
                    className={`p-3 rounded-lg border transition-all text-left ${
                      selectedUser === u.id
                        ? 'border-purple-500 bg-purple-500/20 text-white'
                        : 'border-white/10 text-gray-300 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <div className="font-medium">{u.name}</div>
                    <div className="text-sm opacity-70">{u.email}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Select Video */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Movie/Video
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search videos..."
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 mb-4"
              />
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                {filteredVideos.map((video) => (
                  <button
                    key={video.id}
                    onClick={() => setSelectedVideo(video.id)}
                    className={`p-3 rounded-lg border transition-all text-left ${
                      selectedVideo === video.id
                        ? 'border-purple-500 bg-purple-500/20 text-white'
                        : 'border-white/10 text-gray-300 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {video.thumbnail_url && (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-12 h-12 rounded object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{video.title}</div>
                        {video.duration && (
                          <div className="text-sm opacity-70">
                            {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateRoom(false);
                  setSelectedUser('');
                  setSelectedVideo('');
                }}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={!selectedUser || !selectedVideo || loading}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Creating...' : 'Create Room'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Upload Modal */}
      {showVideoUpload && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-6">Upload Video</h3>
            
            <VideoManager onVideoUploaded={handleVideoUploaded} />
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowVideoUpload(false)}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}
