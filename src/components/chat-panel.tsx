'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { useRoomStore } from '@/stores/room-store';
import type { MessageWithUser } from '@/types';

interface Props {
  roomId: string;
  messages: MessageWithUser[];
  overlay?: boolean;
}

export function ChatPanel({ roomId, messages, overlay = false }: Props) {
  const [message, setMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sendMessage } = useRoomStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const messageText = message.trim();
    
    // Clear input immediately for instant feedback
    setMessage('');
    
    // Optimistically add message to UI immediately (AJAX-style)
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      message: messageText,
      user_id: 'current-user',
      created_at: new Date().toISOString(),
      user: {
        id: 'current-user',
        name: 'You',
        email: ''
      }
    };

    try {
      // Send to server
      await sendMessage(messageText);
      console.log('ChatPanel - Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      // Could show error state or revert optimistic update
    }
  };

  if (overlay) {
    return (
      <div className="bg-black/60 backdrop-blur-md rounded-lg p-4 border border-white/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 text-white">
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm font-medium">Chat</span>
          </div>
        </div>
        
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {messages.slice(-3).map((msg) => (
            <div key={msg.id} className="text-white">
              <div className="flex items-baseline space-x-2">
                <span className="text-xs font-medium text-purple-400">{msg.user.name}:</span>
                <span className="text-sm opacity-90">{msg.message}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center space-x-2 text-white">
          <MessageSquare className="w-5 h-5" />
          <span className="font-medium">Chat</span>
        </div>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className={`w-4 h-4 transform transition-transform ${isMinimized ? '' : 'rotate-45'}`} />
        </button>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 text-sm">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="space-y-1">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-xs font-medium text-purple-400">
                      {msg.user.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="text-white text-sm break-words">
                    {msg.message}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-white/10">
            <form onSubmit={handleSubmit} className="flex items-center space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 text-sm"
                maxLength={500}
              />
              <button
                type="submit"
                disabled={!message.trim()}
                className="p-2 text-purple-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
