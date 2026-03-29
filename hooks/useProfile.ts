import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useSession } from './useSession';
import type { Profile, GardenPlant, ProfileStats } from '../types/database';

export interface UseProfileResult {
  profile: Profile | null;
  stats: ProfileStats;
  recentPlants: GardenPlant[];
  loading: boolean;
  updateDisplayName: (name: string) => Promise<void>;
  updateBio: (bio: string) => Promise<void>;
  updateAvatarUrl: (url: string) => Promise<void>;
}

export function useProfile(userId?: string): UseProfileResult {
  const { user } = useSession();
  const targetId = userId ?? user?.id;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    current_streak: 0,
    total_completed: 0,
    friends_count: 0,
    plants_count: 0,
  });
  const [recentPlants, setRecentPlants] = useState<GardenPlant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const load = useCallback(async (): Promise<void> => {
    if (!targetId) {
      setLoading(false);
      return;
    }

    const [profileRes, streakRes, tasksRes, friendsRes, plantsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', targetId).single(),
      supabase.from('streaks').select('current_streak').eq('user_id', targetId).single(),
      supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('user_id', targetId).eq('is_completed', true),
      supabase.from('friendships').select('id', { count: 'exact', head: true })
        .or(`requester_id.eq.${targetId},addressee_id.eq.${targetId}`)
        .eq('status', 'accepted'),
      supabase.from('garden_plants').select('*').eq('user_id', targetId).order('created_at', { ascending: false }).limit(8),
    ]);

    if (profileRes.data) setProfile(profileRes.data as Profile);

    setStats({
      current_streak: (streakRes.data as { current_streak: number } | null)?.current_streak ?? 0,
      total_completed: tasksRes.count ?? 0,
      friends_count: friendsRes.count ?? 0,
      plants_count: plantsRes.data?.length ?? 0,
    });

    if (plantsRes.data) setRecentPlants(plantsRes.data as GardenPlant[]);

    setLoading(false);
  }, [targetId]);

  useEffect(() => {
    load();
  }, [load]);

  const updateDisplayName = async (name: string): Promise<void> => {
    if (!user || userId) return;
    const trimmed = name.trim();
    if (!trimmed) return;

    const { data } = await supabase
      .from('profiles')
      .update({ display_name: trimmed })
      .eq('id', user.id)
      .select()
      .single();

    if (data) setProfile(data as Profile);
  };

  const updateBio = async (bio: string): Promise<void> => {
    if (!user || userId) return;

    const { data } = await supabase
      .from('profiles')
      .update({ bio: bio.trim() || null })
      .eq('id', user.id)
      .select()
      .single();

    if (data) setProfile(data as Profile);
  };

  const updateAvatarUrl = async (url: string): Promise<void> => {
    if (!user || userId) return;

    const { data } = await supabase
      .from('profiles')
      .update({ avatar_url: url })
      .eq('id', user.id)
      .select()
      .single();

    if (data) setProfile(data as Profile);
  };

  return { profile, stats, recentPlants, loading, updateDisplayName, updateBio, updateAvatarUrl };
}
