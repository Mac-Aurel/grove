import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.100.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getPlantType(streak: number): string {
  if (streak <= 3) return 'sprout';
  if (streak <= 7) return 'seedling';
  if (streak <= 14) return 'herb';
  if (streak <= 21) return 'bush';
  if (streak <= 30) return 'small_tree';
  if (streak <= 60) return 'tree';
  if (streak <= 90) return 'blooming_tree';
  return 'ancient_tree';
}

function getPlantName(plantType: string): string {
  const names: Record<string, string> = {
    sprout: 'Sprout',
    seedling: 'Seedling',
    herb: 'Herb',
    bush: 'Bush',
    small_tree: 'Small Tree',
    tree: 'Tree',
    blooming_tree: 'Blooming Tree',
    ancient_tree: 'Ancient Tree',
  };
  return names[plantType] ?? plantType;
}

interface TaskRow {
  user_id: string;
}

interface StreakRow {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
}

serve(async (_req: Request): Promise<Response> => {
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const yesterday = toDateString(new Date(Date.now() - 86400000));

  // Get all users with tasks for yesterday
  const { data: taskRows } = await adminClient
    .from('tasks')
    .select('user_id')
    .eq('scheduled_date', yesterday);

  const userIds = [...new Set(((taskRows ?? []) as TaskRow[]).map((r) => r.user_id))];

  for (const userId of userIds) {
    const { count: totalCount } = await adminClient
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('scheduled_date', yesterday);

    const { count: completedCount } = await adminClient
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('scheduled_date', yesterday)
      .eq('is_completed', true);

    const total = totalCount ?? 0;
    const completed = completedCount ?? 0;

    const { data: streakData } = await adminClient
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .single();

    const streak = streakData as StreakRow | null;

    if (total > 0 && completed === total) {
      // Already handled by real-time complete-task function
      if (streak?.last_completed_date === yesterday) continue;

      const currentStreak = streak?.current_streak ?? 0;
      const newStreak = currentStreak + 1;
      const longestStreak = Math.max(newStreak, streak?.longest_streak ?? 0);
      const plantType = getPlantType(newStreak);

      if (streak) {
        await adminClient
          .from('streaks')
          .update({
            current_streak: newStreak,
            longest_streak: longestStreak,
            last_completed_date: yesterday,
          })
          .eq('user_id', userId);
      } else {
        await adminClient.from('streaks').insert({
          user_id: userId,
          current_streak: newStreak,
          longest_streak: newStreak,
          last_completed_date: yesterday,
        });
      }

      await adminClient.from('garden_plants').insert({
        user_id: userId,
        plant_type: plantType,
        name: getPlantName(plantType),
        level: 1,
        xp: 0,
        last_watered_at: null,
      });
    } else if (total > 0 && streak && streak.current_streak > 0) {
      // Missed tasks — reset streak
      if (streak.last_completed_date === yesterday) continue;
      await adminClient
        .from('streaks')
        .update({ current_streak: 0 })
        .eq('user_id', userId);
    }
  }

  // Reset streaks for users with no tasks yesterday who still have an active streak
  const { data: allStreaks } = await adminClient
    .from('streaks')
    .select('user_id, current_streak, last_completed_date')
    .gt('current_streak', 0);

  for (const s of ((allStreaks ?? []) as StreakRow[])) {
    if (userIds.includes(s.user_id)) continue;
    if (!s.last_completed_date || s.last_completed_date >= yesterday) continue;
    await adminClient
      .from('streaks')
      .update({ current_streak: 0 })
      .eq('user_id', s.user_id);
  }

  return new Response(JSON.stringify({ ok: true, processed: userIds.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
