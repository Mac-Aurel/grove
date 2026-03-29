import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useSession } from './useSession';
import type { Task } from '../types/database';

export interface CompleteTaskResult {
  streakUpdated: boolean;
  newStreak: number;
  plantEarned: boolean;
  plantType: string;
}

export interface UseTasksResult {
  tasks: Task[];
  loading: boolean;
  addTask: (title: string, isPublic: boolean, date: string) => Promise<void>;
  completeTask: (id: string, photoUrl?: string) => Promise<CompleteTaskResult | null>;
  refetch: () => Promise<void>;
}

export function useTasks(scheduledDate: string): UseTasksResult {
  const { user } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetch = useCallback(async (): Promise<void> => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('scheduled_date', scheduledDate)
      .eq('is_completed', false)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setTasks(data as Task[]);
    }
    setLoading(false);
  }, [user, scheduledDate]);

  useEffect(() => {
    setLoading(true);
    fetch();
  }, [fetch]);

  const addTask = async (title: string, isPublic: boolean, date: string): Promise<void> => {
    if (!user) return;

    const optimistic: Task = {
      id: `temp-${Date.now()}`,
      user_id: user.id,
      title,
      description: null,
      is_public: isPublic,
      is_completed: false,
      completed_at: null,
      photo_proof_url: null,
      scheduled_date: date,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setTasks((prev) => [...prev, optimistic]);

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title: title.trim(),
        is_public: isPublic,
        scheduled_date: date,
      })
      .select()
      .single();

    if (!error && data) {
      setTasks((prev) => prev.map((t) => (t.id === optimistic.id ? (data as Task) : t)));
    } else {
      setTasks((prev) => prev.filter((t) => t.id !== optimistic.id));
    }
  };

  const completeTask = async (
    id: string,
    photoUrl?: string,
  ): Promise<CompleteTaskResult | null> => {
    setTasks((prev) => prev.filter((t) => t.id !== id));

    const { data, error } = await supabase.functions.invoke('complete-task', {
      body: {
        task_id: id,
        photo_url: photoUrl ?? null,
        scheduled_date: scheduledDate,
      },
    });

    if (error) {
      fetch();
      return null;
    }

    return data as CompleteTaskResult;
  };

  return { tasks, loading, addTask, completeTask, refetch: fetch };
}
