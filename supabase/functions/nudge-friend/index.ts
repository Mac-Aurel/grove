import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.100.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

interface FriendshipRow {
  id: string;
  nudged_at: string | null;
}

interface ProfileRow {
  display_name: string;
}

interface PushTokenRow {
  token: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const body = await req.json() as { target_user_id?: string };
  const { target_user_id } = body;

  if (!target_user_id) {
    return new Response(JSON.stringify({ error: 'Missing target_user_id' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Verify accepted friendship exists
  const { data: friendship, error: friendshipError } = await supabase
    .from('friendships')
    .select('id, nudged_at')
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${target_user_id}),` +
      `and(requester_id.eq.${target_user_id},addressee_id.eq.${user.id})`,
    )
    .eq('status', 'accepted')
    .single<FriendshipRow>();

  if (friendshipError || !friendship) {
    return new Response(JSON.stringify({ error: 'Friendship not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Enforce 24-hour rate limit
  if (friendship.nudged_at) {
    const hoursSince = (Date.now() - new Date(friendship.nudged_at).getTime()) / 3_600_000;
    if (hoursSince < 24) {
      return new Response(JSON.stringify({ error: 'Rate limited: 1 nudge per 24 hours' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // Fetch sender display name
  const { data: senderProfile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single<ProfileRow>();

  const senderName = senderProfile?.display_name ?? 'Someone';

  // Fetch target push tokens
  const { data: pushTokens } = await supabase
    .from('push_tokens')
    .select('token')
    .eq('user_id', target_user_id);

  if (pushTokens && pushTokens.length > 0) {
    const messages = (pushTokens as PushTokenRow[]).map((pt) => ({
      to: pt.token,
      title: 'grove',
      body: `${senderName} is rooting for you`,
      sound: 'default',
    }));

    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(messages),
    });
  }

  // Update nudged_at timestamp
  await supabase
    .from('friendships')
    .update({ nudged_at: new Date().toISOString() })
    .eq('id', friendship.id);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
