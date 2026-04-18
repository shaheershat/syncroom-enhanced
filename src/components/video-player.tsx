'use client';

import { useState, useRef, useEffect, forwardRef } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  SkipForward,
  SkipBack,
  Settings,
  RotateCcw,
  Maximize2
} from 'lucide-react';
import { RoomState, PlaybackRate } from '@/types';

interface Props {
  videoUrl: string;
  state: RoomState | null;
  onAction: (action: string, payload?: any) => void;
  isFullscreen: boolean;
  room: any;
}

export const VideoPlayer = forwardRef<HTMLVideoElement, Props>(
  ({ videoUrl, state, onAction, isFullscreen = false, room }, ref) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState<PlaybackRate>(1.0);
    const [showControls, setShowControls] = useState(false);
    const [buffering, setBuffering] = useState(false);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const progressBarRef = useRef<HTMLDivElement>(null);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Sync with room state
    useEffect(() => {
      if (!state || !videoRef.current) return;

      // Sync play/pause
      if (state.playing !== isPlaying) {
        if (state.playing) {
          videoRef.current.play();
        } else {
          videoRef.current.pause();
        }
      }

      // Sync current time (with tolerance to prevent loops)
      const timeDiff = Math.abs(state.video_time - currentTime);
      if (timeDiff > 2) {
        videoRef.current.currentTime = state.video_time;
      }

      // Sync playback rate
      if (state.playback_rate !== playbackRate) {
        videoRef.current.playbackRate = state.playback_rate;
        setPlaybackRate(state.playback_rate);
      }
    }, [state, isPlaying, currentTime, playbackRate]);

    // Auto-hide controls
    useEffect(() => {
      const showControlsTemporarily = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = setTimeout(() => {
          if (isPlaying) {
            setShowControls(false);
          }
        }, 3000);
      };

      const video = videoRef.current;
      if (video) {
        video.addEventListener('play', showControlsTemporarily);
        video.addEventListener('pause', () => setShowControls(true));
        video.addEventListener('mousemove', showControlsTemporarily);
        video.addEventListener('mouseenter', showControlsTemporarily);
        video.addEventListener('mouseleave', () => {
          if (isPlaying) {
            setShowControls(false);
          }
        });
      }

      return () => {
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
      };
    }, [isPlaying, showControls]);

    const handlePlayPause = () => {
      onAction(isPlaying ? 'pause' : 'play');
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressBarRef.current || !videoRef.current) return;
      
      const rect = progressBarRef.current.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const newTime = percent * duration;
      
      onAction('seek', newTime);
    };

    const handleSkip = (seconds: number) => {
      onAction(seconds > 0 ? 'skip_forward' : 'skip_backward');
    };

    const handleSpeedChange = (rate: PlaybackRate) => {
      onAction('speed_change', rate);
      setShowSpeedMenu(false);
    };

    const handleVolumeChange = (newVolume: number) => {
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
      if (videoRef.current) {
        videoRef.current.volume = newVolume;
      }
    };

    const handleMuteToggle = () => {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      if (videoRef.current) {
        videoRef.current.muted = newMuted;
      }
    };

    const handleFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    };

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const playbackRates: PlaybackRate[] = [0.5, 1.0, 1.5, 2.0, 3.0];

    // Add logging for video URL
    console.log('VideoPlayer - videoUrl:', videoUrl);

    // Handle empty or invalid video URL
    if (!videoUrl || videoUrl === '') {
      console.log('VideoPlayer - No valid video URL, showing placeholder');
      return (
        <div className="relative w-full h-full bg-black flex items-center justify-center">
          <div className="text-white text-center">
            <div className="text-2xl mb-4">No Video Available</div>
            <div className="text-gray-400">Please check your video URL</div>
          </div>
        </div>
      );
    }

    // Check if it's a Google Drive URL and use iframe for better compatibility
    if (videoUrl.includes('drive.google.com')) {
      console.log('VideoPlayer - Using iframe for Google Drive video:', videoUrl);
      const fileId = videoUrl.includes('id=') ? videoUrl.split('id=')[1] : videoUrl.split('/d/')[1]?.split('/')[0];
      
      return (
        <div className="relative w-full h-full bg-black">
          <iframe
            src={`https://drive.google.com/file/d/${fileId}/preview`}
            className="w-full h-full border-0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            onLoad={() => console.log('VideoPlayer - Google Drive iframe loaded')}
          />
        </div>
      );
    }

    // Use regular video player for non-Google Drive URLs
    console.log('VideoPlayer - Using regular video player for:', videoUrl);
    let finalVideoUrl = videoUrl;

    return (
      <div className="relative w-full h-full bg-black group">
        <video
          ref={videoRef || ref}
          src={finalVideoUrl}
          className="w-full h-full object-contain"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={(e) => {
            const video = e.currentTarget;
            setCurrentTime(video.currentTime);
          }}
          onLoadedMetadata={(e) => {
            const video = e.currentTarget;
            console.log('VideoPlayer - Video loaded metadata, duration:', video.duration);
            setDuration(video.duration);
          }}
          onCanPlay={() => {
            console.log('VideoPlayer - Video can play');
          }}
          onError={(e) => {
            console.error('VideoPlayer - Video error:', e);
            console.error('VideoPlayer - Video error code:', (e.target as HTMLVideoElement).error);
          }}
          onLoadStart={() => {
            console.log('VideoPlayer - Video load start');
          }}
          onWaiting={() => {
            console.log('VideoPlayer - Video waiting');
          }}
          controls={false}
          playsInline
          crossOrigin="anonymous"
        />

        {/* Buffering Indicator */}
        {buffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="w-12 h-12 border-3 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* Video Controls */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
            showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Progress Bar */}
          <div
            ref={progressBarRef}
            className="w-full h-2 bg-white/20 rounded-full cursor-pointer mb-4 group"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full relative"
              style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
            >
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Play/Pause */}
              <button
                onClick={handlePlayPause}
                className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>

              {/* Skip Backward */}
              <button
                onClick={() => handleSkip(-10)}
                className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              {/* Skip Forward */}
              <button
                onClick={() => handleSkip(10)}
                className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
              >
                <SkipForward className="w-5 h-5" />
              </button>

              {/* Time Display */}
              <div className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>

              {/* Volume */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleMuteToggle}
                  className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
                />
              </div>

              {/* Playback Speed */}
              <div className="relative">
                <button
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                >
                  <Settings className="w-5 h-5" />
                </button>
                
                {showSpeedMenu && (
                  <div className="absolute bottom-full left-0 mb-2 bg-slate-800 rounded-lg p-2 shadow-xl border border-white/20">
                    {playbackRates.map((rate) => (
                      <button
                        key={rate}
                        onClick={() => handleSpeedChange(rate)}
                        className={`block w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                          rate === playbackRate
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Fullscreen */}
            <button
              onClick={handleFullscreen}
              className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';
