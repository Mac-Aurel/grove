import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.100.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

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

interface StreakRow {
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing auth' }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const userClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  const body = await req.json() as {
    task_id: string;
    photo_url?: string | null;
    scheduled_date: string;
  };
  const { task_id, photo_url, scheduled_date } = body;

  // Mark task complete
  const updateData: Record<string, unknown> = {
    is_completed: true,
    completed_at: new Date().toISOString(),
  };
  if (photo_url) updateData.photo_proof_url = photo_url;

  const { error: updateError } = await adminClient
    .from('tasks')
    .update(updateData)
    .eq('id', task_id)
    .eq('user_id', user.id);

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  // Streak logic only applies to today's tasks
  const today = toDateString(new Date());
  if (scheduled_date !== today) {
    return new Response(
      JSON.stringify({ streakUpdated: false, newStreak: 0, plantEarned: false, plantType: '' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  // Count remaining incomplete tasks for today
  const { count: remaining } = await adminClient
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('scheduled_date', today)
    .eq('is_completed', false);

  if ((remaining ?? 1) > 0) {
    const { data: streakRow } = await adminClient
      .from('streaks')
      .select('current_streak')
      .eq('user_id', user.id)
      .single();

    return new Response(
      JSON.stringify({
        streakUpdated: false,
        newStreak: (streakRow as { current_streak: number } | null)?.current_streak ?? 0,
        plantEarned: false,
        plantType: '',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  // All tasks complete — process streak
  const { data: streakData } = await adminClient
    .from('streaks')
    .select('current_streak, longest_streak, last_completed_date')
    .eq('user_id', user.id)
    .single();

  const streak = streakData as StreakRow | null;

  // Already updated today (guard against duplicate calls)
  if (streak?.last_completed_date === today) {
    return new Response(
      JSON.stringify({
        streakUpdated: false,
        newStreak: streak.current_streak,
        plantEarned: false,
        plantType: '',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const yesterday = toDateString(new Date(Date.now() - 86400000));
  const continues = streak?.last_completed_date === yesterday;
  const newStreak = continues ? (streak?.current_streak ?? 0) + 1 : 1;
  const longestStreak = Math.max(newStreak, streak?.longest_streak ?? 0);
  const plantType = getPlantType(newStreak);

  if (streak) {
    await adminClient
      .from('streaks')
      .update({ current_streak: newStreak, longest_streak: longestStreak, last_completed_date: today })
      .eq('user_id', user.id);
  } else {
    await adminClient.from('streaks').insert({
      user_id: user.id,
      current_streak: newStreak,
      longest_streak: newStreak,
      last_completed_date: today,
    });
  }

  await adminClient.from('garden_plants').insert({
    user_id: user.id,
    plant_type: plantType,
    name: getPlantName(plantType),
    level: 1,
    xp: 0,
    last_watered_at: null,
  });

  return new Response(
    JSON.stringify({ streakUpdated: true, newStreak, plantEarned: true, plantType }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
