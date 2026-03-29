import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useSession } from './useSession';
import type { CompletionDay } from '../types/database';

export interface UseCompletionHistoryResult {
  history: CompletionDay[];
  loading: boolean;
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function useCompletionHistory(userId?: string): UseCompletionHistoryResult {
  const { user } = useSession();
  const targetId = userId ?? user?.id;

  const [history, setHistory] = useState<CompletionDay[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!targetId) {
      setLoading(false);
      return;
    }

    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 59);

    supabase
      .from('tasks')
      .select('scheduled_date, is_completed')
      .eq('user_id', targetId)
      .gte('scheduled_date', toDateString(start))
      .lte('scheduled_date', toDateString(end))
      .then(({ data, error }) => {
        if (error || !data) {
          setLoading(false);
          return;
        }

        const map: Record<string, { total: number; completed: number }> = {};
        (data as Array<{ scheduled_date: string; is_completed: boolean }>).forEach((row) => {
          if (!map[row.scheduled_date]) map[row.scheduled_date] = { total: 0, completed: 0 };
          map[row.scheduled_date].total += 1;
          if (row.is_completed) map[row.scheduled_date].completed += 1;
        });

        const days: CompletionDay[] = [];
        for (let i = 59; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = toDateString(d);
          const entry = map[dateStr];
          const total = entry?.total ?? 0;
          const completed = entry?.completed ?? 0;
          days.push({ date: dateStr, total, completed, rate: total > 0 ? completed / total : 0 });
        }

        setHistory(days);
        setLoading(false);
      });
  }, [targetId]);

  return { history, loading };
}
