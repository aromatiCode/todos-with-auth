// supabase/functions/check-reminders/index.ts
// Edge Function that runs on a schedule to check for due reminders and send push notifications

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Get the Supabase URL - try both possible env var names
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('REACT_APP_SUPABASE_URL');
    
    // Try to get service key, fall back to anon key if not available
    let supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseServiceKey) {
      // Try to get from Authorization header if no service key set
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        supabaseServiceKey = authHeader.replace('Bearer ', '');
      }
    }
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ 
        error: 'Missing configuration', 
        supabaseUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceKey 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Create admin client to bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Find todos with pending reminders that are due
    const now = new Date().toISOString();
    
    const { data: pendingReminders, error } = await supabaseAdmin
      .from('todos')
      .select('id, title, user_id, reminder_at')
      .lte('reminder_at', now)
      .eq('notification_sent', false)
      .not('reminder_at', 'is', null);

    if (error) {
      console.error('Error fetching pending reminders:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!pendingReminders || pendingReminders.length === 0) {
      return new Response(JSON.stringify({ message: 'No pending reminders', processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${pendingReminders.length} pending reminders`);

    // Process each reminder
    for (const todo of pendingReminders) {
      // Get user's FCM token from user metadata
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(todo.user_id);
      const fcmToken = userData?.user?.user_metadata?.fcm_token;

      if (fcmToken) {
        // Send push notification via FCM
        await sendPushNotification(fcmToken, {
          title: '📅 Todo Reminder',
          body: todo.title,
          icon: '/icon.png',
          click_action: '/todos',
        }, supabaseUrl, supabaseServiceKey);
      }

      // Mark notification as sent
      await supabaseAdmin
        .from('todos')
        .update({ notification_sent: true })
        .eq('id', todo.id);
    }

    return new Response(JSON.stringify({ processed: pendingReminders.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in check-reminders function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function sendPushNotification(token: string, notification: any, supabaseUrl: string, serviceKey: string) {
  const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');
  
  if (!fcmServerKey) {
    console.log('FCM_SERVER_KEY not configured, skipping push notification');
    return;
  }

  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${fcmServerKey}`,
      },
      body: JSON.stringify({
        to: token,
        notification,
      }),
    });

    const result = await response.json();
    console.log('FCM response:', result);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}
