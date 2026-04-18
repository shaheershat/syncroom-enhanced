'use client';

import { useState, useRef } from 'react';
import { Upload, X, Film, FileVideo } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Video } from '@/types';

interface Props {
  onVideoUploaded: (video: Video) => void;
}

export function VideoUpload({ onVideoUploaded }: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      alert('Please select a video file');
      return;
    }

    if (file.size > 500 * 1024 * 1024) { // 500MB limit
      alert('Video file must be less than 500MB');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `videos/${fileName}`;

      // Upload video to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              ((progressEvent.loaded || 0) / (progressEvent.total || 1)) * 100
            );
            setProgress(percent);
          },
        });

      if (uploadError) throw uploadError;

      // Get video duration (this is a rough estimate - for production you'd want more accurate duration detection)
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
        video.src = URL.createObjectURL(file);
      });

      const duration = Math.floor(video.duration);

      // Create video record in database
      const { data: videoData, error: dbError } = await supabase
        .from('videos')
        .insert({
          title: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
          storage_path: filePath,
          duration,
          file_size: file.size,
          mime_type: file.type,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      onVideoUploaded(videoData);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload video. Please try again.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-purple-500 bg-purple-500/10'
            : 'border-white/20 hover:border-white/30 hover:bg-white/5'
        } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileInput}
          className="hidden"
        />
        
        {!uploading ? (
          <>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center">
                <Film className="w-8 h-8 text-purple-400" />
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-white font-medium">Upload Video</p>
              <p className="text-gray-400 text-sm">
                Drag and drop a video file here, or click to browse
              </p>
              <p className="text-gray-500 text-xs">
                MP4, WebM, OGG up to 500MB
              </p>
            </div>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Select Video
            </button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center">
                <FileVideo className="w-8 h-8 text-purple-400 animate-pulse" />
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-white font-medium">Uploading...</p>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-gray-400 text-sm">{progress}%</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
