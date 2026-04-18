'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Film, Clock, HardDrive } from 'lucide-react';

interface VideoManagerProps {
  onVideoUploaded?: (video: any) => Promise<void>;
}

export default function VideoManager({ onVideoUploaded }: VideoManagerProps) {
  const [videos, setVideos] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVideo, setNewVideo] = useState({
    title: '',
    video_url: '',
    duration: 0,
    file_size: 0
  });

  const loadVideos = async () => {
    const { data } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false });
    setVideos(data || []);
  };

  const addVideo = async (title: string, video_url: string, duration?: number) => {
    // Convert Google Drive share URL to direct download URL if needed
    let finalVideoUrl = video_url.trim();
    if (video_url.includes('drive.google.com/file/d/')) {
      const fileId = video_url.split('/d/')[1]?.split('/')[0];
      if (fileId) {
        finalVideoUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      }
    }

    const { data } = await supabase
      .from('videos')
      .insert({
        title,
        video_url: finalVideoUrl,
        duration: duration || 0,
      })
      .select()
      .single();

    if (data) {
      setVideos([data, ...videos]);
      setNewVideo({ title: '', video_url: '', duration: 0, file_size: 0 });
      setShowAddForm(false);
      
      // Call the callback if provided
      if (onVideoUploaded) {
        await onVideoUploaded(data);
      }
    }
  };

  const deleteVideo = async (id: string) => {
    await supabase.from('videos').delete().eq('id', id);
    setVideos(videos.filter(v => v.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center">
          <Film className="w-5 h-5 mr-2" />
          Video Library
        </h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Video
        </button>
      </div>

      {/* Add Video Form */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
          <h4 className="text-white font-medium mb-4">Add New Video</h4>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Video Title"
              value={newVideo.title}
              onChange={(e) => setNewVideo({...newVideo, title: e.target.value})}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
            />
            <input
              type="url"
              placeholder="Video URL (Google Drive, Dropbox, etc.)"
              value={newVideo.video_url}
              onChange={(e) => setNewVideo({...newVideo, video_url: e.target.value})}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
            />
            <div className="flex space-x-4">
              <input
                type="number"
                placeholder="Duration (seconds)"
                value={newVideo.duration}
                onChange={(e) => setNewVideo({...newVideo, duration: parseInt(e.target.value) || 0})}
                className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
              />
              <input
                type="number"
                placeholder="File Size (bytes)"
                value={newVideo.file_size}
                onChange={(e) => setNewVideo({...newVideo, file_size: parseInt(e.target.value) || 0})}
                className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  if (newVideo.title.trim() && newVideo.video_url.trim()) {
                    addVideo(newVideo.title, newVideo.video_url, newVideo.duration);
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Add Video
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video List */}
      <div className="space-y-3">
        {videos.map((video) => (
          <div key={video.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="flex-1">
              <h4 className="text-white font-medium">{video.title}</h4>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {formatDuration(video.duration)}
                </span>
                {video.file_size > 0 && (
                  <span className="flex items-center">
                    <HardDrive className="w-4 h-4 mr-1" />
                    {formatFileSize(video.file_size)}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => deleteVideo(video.id)}
              className="p-2 text-red-400 hover:text-red-300 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {videos.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <Film className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No videos yet. Add your first video to get started!</p>
        </div>
      )}
    </div>
  );
}
