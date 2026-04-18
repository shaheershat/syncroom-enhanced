export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          approved: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          approved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          name?: string;
          approved?: boolean;
          updated_at?: string;
        };
      };
      videos: {
        Row: {
          id: string;
          title: string;
          video_url: string;
          thumbnail_url?: string;
          duration?: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          video_url: string;
          thumbnail_url?: string;
          duration?: number;
          created_at?: string;
        };
        Update: {
          title?: string;
          video_url?: string;
          thumbnail_url?: string;
          duration?: number;
        };
      };
      rooms: {
        Row: {
          id: string;
          created_by: string;
          invited_user_id: string;
          video_id: string;
          status: 'active' | 'ended';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          created_by: string;
          invited_user_id: string;
          video_id: string;
          status?: 'active' | 'ended';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          invited_user_id?: string;
          video_id?: string;
          status?: 'active' | 'ended';
          updated_at?: string;
        };
      };
      room_presence: {
        Row: {
          id: string;
          room_id: string;
          user_id: string;
          online: boolean;
          last_seen: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          user_id: string;
          online?: boolean;
          last_seen?: string;
          created_at?: string;
        };
        Update: {
          online?: boolean;
          last_seen?: string;
        };
      };
      room_state: {
        Row: {
          id: string;
          room_id: string;
          playing: boolean;
          video_time: number;
          playback_rate: 0.5 | 1.0 | 1.5 | 2.0 | 3.0;
          updated_by: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          playing?: boolean;
          video_time?: number;
          playback_rate?: 0.5 | 1.0 | 1.5 | 2.0 | 3.0;
          updated_by: string;
          updated_at?: string;
        };
        Update: {
          playing?: boolean;
          video_time?: number;
          playback_rate?: 0.5 | 1.0 | 1.5 | 2.0 | 3.0;
          updated_by?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          room_id: string;
          user_id: string;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          user_id: string;
          message: string;
          created_at?: string;
        };
        Update: {
          message?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_user_approved: () => boolean;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};
