import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useSession } from './useSession';
import type { GardenPlant } from '../types/database';

export interface UseGardenResult {
  plants: GardenPlant[];
  loading: boolean;
}

export function useGarden(): UseGardenResult {
  const { user } = useSession();
  const [plants, setPlants] = useState<GardenPlant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) {
      setPlants([]);
      setLoading(false);
      return;
    }

    supabase
      .from('garden_plants')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setPlants(data as GardenPlant[]);
        setLoading(false);
      });
  }, [user]);

  return { plants, loading };
}
