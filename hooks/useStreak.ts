import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useSession } from './useSession';
import type { Streak } from '../types/database';

export interface UseStreakResult {
  streak: Streak | null;
  loading: boolean;
}

export function useStreak(): UseStreakResult {
  const { user } = useSession();
  const [streak, setStreak] = useState<Streak | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) {
      setStreak(null);
      setLoading(false);
      return;
    }

    supabase
      .from('streaks')
      .select('*')
      .eq('user_id', user.id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setStreak(data as Streak);
        setLoading(false);
      });
  }, [user]);

  return { streak, loading };
}
