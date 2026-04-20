'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Sparkles, Shield } from 'lucide-react';

const USERS = [
  { username: 'shaheer', code: 'SHAHEER123', name: 'Shaheer', role: 'admin' as const, id: 'user-shaheer' },
  { username: 'admin',   code: 'ADMIN123',   name: 'Admin',   role: 'admin' as const, id: 'user-admin' },
];

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    const match = USERS.find(
      u => u.username === username.trim().toLowerCase() && u.code === accessCode.trim()
    );

    if (match) {
      const user = { id: match.id, name: match.name, username: match.username, role: match.role };
      localStorage.setItem('currentUser', JSON.stringify(user));
      // Set session cookie so proxy allows access to protected routes
      document.cookie = `syncroom_session=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=${2 * 24 * 60 * 60}`;
      router.push(match.role === 'admin' ? '/admin' : '/dashboard');
    } else {
      setMessage('Invalid username or access code');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      
      <div className="relative w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl mb-4 shadow-2xl">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">SyncRoom Enhanced</h1>
          <p className="text-gray-300">Watch together, in perfect sync</p>
          <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-400">
            <Shield className="w-4 h-4" />
            <span>Admin Access: shaheer / SHAHEER123</span>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-4 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:bg-white/10 transition-all"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            {/* Access Code */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Access Code
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:bg-white/10 transition-all"
                  placeholder="Enter access code"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Signing in...
                </div>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Message */}
          {message && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              message.includes('sent') 
                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                : 'bg-red-500/20 text-red-300 border border-red-500/30'
            }`}>
              {message}
            </div>
          )}

          {/* Help Text */}
          <div className="mt-6 text-center text-sm text-gray-400">
            <p>SyncRoom - Private Watch Parties</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-400">
          <p>Private invite-only platform</p>
          <p className="mt-1">Contact admin for access</p>
        </div>
      </div>
    </div>
  );
}
