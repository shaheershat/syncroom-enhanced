'use client';

import { AlertTriangle, Play, Pause, SkipForward, SkipBack, Settings } from 'lucide-react';
import { ConfirmationModal as ConfirmationModalType, SyncAction } from '@/types';

interface Props {
  isOpen: boolean;
  action: SyncAction | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationModal({ isOpen, action, onConfirm, onCancel }: Props) {
  if (!isOpen || !action) return null;

  const getActionIcon = () => {
    switch (action.type) {
      case 'play':
        return <Play className="w-6 h-6" />;
      case 'pause':
        return <Pause className="w-6 h-6" />;
      case 'seek':
        return <SkipForward className="w-6 h-6" />;
      case 'skip_forward':
        return <SkipForward className="w-6 h-6" />;
      case 'skip_backward':
        return <SkipBack className="w-6 h-6" />;
      case 'speed_change':
        return <Settings className="w-6 h-6" />;
      default:
        return <AlertTriangle className="w-6 h-6" />;
    }
  };

  const getActionText = () => {
    switch (action.type) {
      case 'play':
        return 'play the video';
      case 'pause':
        return 'pause the video';
      case 'seek':
        return 'seek to a different position';
      case 'skip_forward':
        return 'skip forward 10 seconds';
      case 'skip_backward':
        return 'skip backward 10 seconds';
      case 'speed_change':
        return `change playback speed to ${action.payload}x`;
      default:
        return 'perform this action';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-white/20 shadow-2xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center text-yellow-500">
            {getActionIcon()}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Confirm Action</h3>
            <p className="text-sm text-gray-400">This will affect the other user</p>
          </div>
        </div>
        
        <p className="text-gray-300 mb-6">
          Are you sure you want to {getActionText()}? This action will be synchronized for both users in the room.
        </p>
        
        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            No
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
}
