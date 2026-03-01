// supabase/functions/todos/index.ts
// Edge Function for todos CRUD operations

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
    // Get the Supabase URL and service role key from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client to bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // When "Verify JWT" is enabled, get user from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    const method = req.method;
    
    // Get the path and extract todo ID
    const url = new URL(req.url);
    const pathname = url.pathname;
    
    // Find "todos" in path and get everything after it
    const todosIndex = pathname.indexOf('/todos');
    let todoId = null;
    if (todosIndex !== -1) {
      const afterTodos = pathname.slice(todosIndex + 6); // +6 for "/todos"
      const cleanId = afterTodos.replace(/^\/|\/$/g, ''); // Remove slashes
      if (cleanId) todoId = cleanId;
    }

    // Handle GET - list all todos
    if (method === 'GET' && !todoId) {
      const { data, error } = await supabaseAdmin
        .from('todos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify(data || []), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    // Handle POST - create new todo
    if (method === 'POST' && !todoId) {
      const body = await req.json();
      const { data, error } = await supabaseAdmin
        .from('todos')
        .insert([{ 
          user_id: userId, 
          title: body.title, 
          completed: body.completed || false,
          reminder_at: body.reminder_at || null,
          notification_sent: false
        }])
        .select()
        .single();
      
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify(data), 
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    // Handle PUT - update todo
    if (method === 'PUT' && todoId) {
      const body = await req.json();
      
      // Build update object - only include fields that are provided
      const updateData: any = {};
      
      if (body.title !== undefined) {
        updateData.title = body.title;
      }
      
      if (body.completed !== undefined) {
        updateData.completed = body.completed;
      }
      
      // Include reminder_at if provided in the update
      if (body.reminder_at !== undefined) {
        updateData.reminder_at = body.reminder_at;
        // Reset notification_sent when reminder is updated
        updateData.notification_sent = false;
      }
      
      if (Object.keys(updateData).length === 0) {
        return new Response(JSON.stringify({ error: 'No fields to update' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      const { data, error } = await supabaseAdmin
        .from('todos')
        .update(updateData)
        .eq('id', todoId)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (!data) {
        return new Response(JSON.stringify({ error: 'Todo not found' }), 
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify(data), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    // Handle DELETE - delete todo
    if (method === 'DELETE' && todoId) {
      const { error } = await supabaseAdmin
        .from('todos')
        .delete()
        .eq('id', todoId)
        .eq('user_id', userId);
      
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ success: true }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Default - method not allowed
    return new Response(JSON.stringify({ error: 'Method not allowed' }), 
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
