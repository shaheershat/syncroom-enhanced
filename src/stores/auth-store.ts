import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import { User, AuthStore } from '@/types';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,

      signUp: async (email: string, password: string, name: string) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name,
              },
            },
          });

          if (error) throw error;

          // Create user profile in database
          if (data.user) {
            const { error: profileError } = await supabase
              .from('users')
              .insert({
                id: data.user.id,
                email: data.user.email!,
                name,
                approved: false, // Admin needs to approve
              });

            if (profileError) throw profileError;
          }

          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      login: async (email: string, password: string) => {
        console.log('🔑 Login attempt for:', email);
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          console.log('📥 Auth response:', { data, error });

          if (error) {
            console.error('❌ Auth error:', error);
            throw error;
          }

          // Fetch user data from database after login
          if (data.user) {
            console.log('✅ Login successful, fetching user data...');
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', data.user.id)
              .single();

            console.log('👥 User data from DB:', { userData, userError });

            if (userError) {
              console.error('❌ Error fetching user data:', userError);
              throw new Error('Failed to load user data');
            }

            set({ 
              user: userData || {
                id: data.user.id,
                email: data.user.email!,
                name: data.user.user_metadata?.name || 'User',
                approved: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }, 
              isAuthenticated: true, 
              isLoading: false 
            });
          }
        } catch (error) {
          console.error('💥 Login failed:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      loginWithMagicLink: async (email: string) => {
        set({ isLoading: true });
        try {
          const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });

          if (error) throw error;
          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await supabase.auth.signOut();
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      updateProfile: async (name: string) => {
        const { user } = get();
        if (!user) throw new Error('Not authenticated');

        set({ isLoading: true });
        try {
          const { data, error } = await supabase
            .from('users')
            .update({ name })
            .eq('id', user.id)
            .select()
            .single();

          if (error) throw error;

          set({ 
            user: data, 
            isLoading: false 
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Initialize auth state
supabase.auth.onAuthStateChange(async (event, session) => {
  const store = useAuthStore.getState();
  
  if (session?.user) {
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!error && userData?.approved) {
        store.user = userData;
        store.isAuthenticated = true;
      } else {
        store.user = null;
        store.isAuthenticated = false;
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error('Error checking user approval:', error);
      store.user = null;
      store.isAuthenticated = false;
    }
  } else {
    store.user = null;
    store.isAuthenticated = false;
  }
});
