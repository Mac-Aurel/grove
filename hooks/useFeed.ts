import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useSession } from './useSession';
import type { FeedItem } from '../types/database';

export interface UseFeedResult {
  feed: FeedItem[];
  loading: boolean;
}

interface FeedQueryRow {
  id: string;
  title: string;
  photo_proof_url: string | null;
  completed_at: string | null;
  user_id: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
}

export function useFeed(): UseFeedResult {
  const { user } = useSession();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) {
      setFeed([]);
      setLoading(false);
      return;
    }

    const loadFeed = async (): Promise<void> => {
      const { data: friendships } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (!friendships || friendships.length === 0) {
        setFeed([]);
        setLoading(false);
        return;
      }

      const friendIds = friendships.map((f) =>
        f.requester_id === user.id ? f.addressee_id : f.requester_id,
      );

      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, photo_proof_url, completed_at, user_id, profiles(username, display_name, avatar_url)')
        .in('user_id', friendIds)
        .eq('is_public', true)
        .eq('is_completed', true)
        .not('photo_proof_url', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        const rows = data as unknown as FeedQueryRow[];
        const items: FeedItem[] = rows
          .filter((row) => row.photo_proof_url !== null && row.completed_at !== null)
          .map((row) => ({
            task_id: row.id,
            title: row.title,
            photo_proof_url: row.photo_proof_url as string,
            completed_at: row.completed_at as string,
            user_id: row.user_id,
            username: row.profiles?.username ?? '',
            display_name: row.profiles?.display_name ?? '',
            avatar_url: row.profiles?.avatar_url ?? null,
          }));
        setFeed(items);
      }
      setLoading(false);
    };

    loadFeed();

    const channel = supabase
      .channel('feed-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tasks' },
        () => { loadFeed(); },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { feed, loading };
}
