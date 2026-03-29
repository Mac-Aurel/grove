export type FriendshipStatus = 'pending' | 'accepted' | 'rejected' | 'blocked';
export type DevicePlatform = 'ios' | 'android';

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  is_completed: boolean;
  completed_at: string | null;
  photo_proof_url: string | null;
  scheduled_date: string;
  created_at: string;
  updated_at: string;
}

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  nudged_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeedItem {
  task_id: string;
  title: string;
  photo_proof_url: string;
  completed_at: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

export interface CompletionDay {
  date: string;
  total: number;
  completed: number;
  rate: number;
}

export interface ProfileStats {
  current_streak: number;
  total_completed: number;
  friends_count: number;
  plants_count: number;
}

export interface Streak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface GardenPlant {
  id: string;
  user_id: string;
  plant_type: string;
  name: string;
  level: number;
  xp: number;
  last_watered_at: string | null;
  created_at: string;
}

export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  platform: DevicePlatform;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string };
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      tasks: {
        Row: Task;
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Omit<Task, 'id' | 'user_id' | 'created_at'>>;
      };
      friendships: {
        Row: Friendship;
        Insert: Omit<Friendship, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Pick<Friendship, 'status' | 'nudged_at' | 'updated_at'>>;
      };
      streaks: {
        Row: Streak;
        Insert: Omit<Streak, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Omit<Streak, 'id' | 'user_id' | 'created_at'>>;
      };
      garden_plants: {
        Row: GardenPlant;
        Insert: Omit<GardenPlant, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<GardenPlant, 'id' | 'user_id' | 'created_at'>>;
      };
      push_tokens: {
        Row: PushToken;
        Insert: Omit<PushToken, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Omit<PushToken, 'id' | 'user_id' | 'created_at'>>;
      };
    };
  };
}
