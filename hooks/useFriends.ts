import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useSession } from './useSession';
import type { Profile, Friendship } from '../types/database';

export interface FriendEntry {
  friendship_id: string;
  profile: Profile;
  nudged_at: string | null;
}

export interface PendingEntry {
  friendship_id: string;
  profile: Profile;
}

export interface UseFriendsResult {
  friends: FriendEntry[];
  pendingReceived: PendingEntry[];
  pendingSentIds: Set<string>;
  searchResults: Profile[];
  searching: boolean;
  loading: boolean;
  searchUsers: (query: string) => Promise<void>;
  clearSearch: () => void;
  addFriend: (userId: string) => Promise<void>;
  acceptFriend: (friendshipId: string) => Promise<void>;
  declineFriend: (friendshipId: string) => Promise<void>;
  nudgeFriend: (userId: string) => Promise<{ error: string | null }>;
}

interface FriendshipWithProfile extends Friendship {
  profiles: Profile | null;
}

export function useFriends(): UseFriendsResult {
  const { user } = useSession();
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [pendingReceived, setPendingReceived] = useState<PendingEntry[]>([]);
  const [pendingSentIds, setPendingSentIds] = useState<Set<string>>(new Set());
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const loadFriendships = useCallback(async (): Promise<void> => {
    if (!user) {
      setFriends([]);
      setPendingReceived([]);
      setPendingSentIds(new Set());
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('friendships')
      .select('*, profiles!friendships_addressee_id_fkey(id, username, display_name, avatar_url, bio, is_public, created_at, updated_at)')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    if (error || !data) {
      setLoading(false);
      return;
    }

    const rows = data as unknown as FriendshipWithProfile[];

    const accepted: FriendEntry[] = [];
    const received: PendingEntry[] = [];
    const sentIds = new Set<string>();

    for (const row of rows) {
      if (row.status === 'accepted') {
        const friendId = row.requester_id === user.id ? row.addressee_id : row.requester_id;

        // Fetch the friend's profile separately if not joined correctly
        let profile = row.profiles;
        if (!profile || profile.id !== friendId) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', friendId)
            .single();
          profile = profileData as Profile | null;
        }

        if (profile) {
          accepted.push({ friendship_id: row.id, profile, nudged_at: row.nudged_at });
        }
      } else if (row.status === 'pending') {
        if (row.addressee_id === user.id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', row.requester_id)
            .single();
          if (profileData) {
            received.push({ friendship_id: row.id, profile: profileData as Profile });
          }
        } else {
          sentIds.add(row.addressee_id);
        }
      }
    }

    setFriends(accepted);
    setPendingReceived(received);
    setPendingSentIds(sentIds);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadFriendships();
  }, [loadFriendships]);

  const searchUsers = async (query: string): Promise<void> => {
    if (!user || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${query}%`)
      .neq('id', user.id)
      .limit(20);

    if (!error && data) {
      setSearchResults(data as Profile[]);
    }
    setSearching(false);
  };

  const clearSearch = (): void => {
    setSearchResults([]);
  };

  const addFriend = async (userId: string): Promise<void> => {
    if (!user) return;

    setPendingSentIds((prev) => new Set([...prev, userId]));

    await supabase.from('friendships').insert({
      requester_id: user.id,
      addressee_id: userId,
      status: 'pending',
    });
  };

  const acceptFriend = async (friendshipId: string): Promise<void> => {
    await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId);

    await loadFriendships();
  };

  const declineFriend = async (friendshipId: string): Promise<void> => {
    await supabase
      .from('friendships')
      .update({ status: 'rejected' })
      .eq('id', friendshipId);

    setPendingReceived((prev) => prev.filter((p) => p.friendship_id !== friendshipId));
  };

  const nudgeFriend = async (userId: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.functions.invoke('nudge-friend', {
      body: { target_user_id: userId },
    });

    if (error) return { error: error.message };

    await loadFriendships();
    return { error: null };
  };

  return {
    friends,
    pendingReceived,
    pendingSentIds,
    searchResults,
    searching,
    loading,
    searchUsers,
    clearSearch,
    addFriend,
    acceptFriend,
    declineFriend,
    nudgeFriend,
  };
}
