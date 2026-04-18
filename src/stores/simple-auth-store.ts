import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface SimpleUser {
  id: string;
  username: string;
  access_code: string;
  name: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

export interface SimpleAuthStore {
  user: SimpleUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, accessCode: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useSimpleAuthStore = create<SimpleAuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (username: string, accessCode: string) => {
        set({ isLoading: true });
        try {
          // Simulate API call - replace with actual Supabase call
          const response = await fetch('/api/simple-auth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, accessCode: access_code }),
          });

          const data = await response.json();

          if (data.success) {
            const user: SimpleUser = {
              id: data.user.id,
              username: data.user.username,
              access_code: data.user.access_code,
              name: data.user.name,
              role: data.user.role,
              created_at: data.user.created_at,
              updated_at: data.user.updated_at,
            };

            set({ 
              user, 
              isAuthenticated: true, 
              isLoading: false 
            });
          } else {
            throw new Error(data.error || 'Login failed');
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'simple-auth-store',
      storage: createJSONStorage(() => localStorage, 'simple-auth-store'),
    },
  ),
);
