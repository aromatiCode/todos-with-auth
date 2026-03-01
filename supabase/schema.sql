-- supabase/schema.sql
-- Run this in your Supabase SQL Editor to set up the database

-- Enable Row Level Security
alter table if exists public.todos enable row level security;

-- Create todos table (if not exists)
create table if not exists public.todos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Calendar reminder fields
  reminder_at timestamp with time zone,
  notification_sent boolean default false
);

-- Create index for faster queries
create index if not exists idx_todos_user_id on public.todos(user_id);

-- Create index for efficient querying of pending reminders
create index if not exists idx_todos_pending_reminders 
on public.todos (reminder_at) 
where reminder_at is not null and notification_sent = false;

-- RLS Policy: Users can only see their own todos
create policy "Users can view their own todos" on public.todos
  for select using (auth.uid() = user_id);

-- RLS Policy: Users can insert their own todos
create policy "Users can insert their own todos" on public.todos
  for insert with check (auth.uid() = user_id);

-- RLS Policy: Users can update their own todos
create policy "Users can update their own todos" on public.todos
  for update using (auth.uid() = user_id);

-- RLS Policy: Users can delete their own todos
create policy "Users can delete their own todos" on public.todos
  for delete using (auth.uid() = user_id);

-- Function to get all todos (for Edge Function)
create or replace function get_todos()
returns setof todos as $$
begin
  return query select * from public.todos where user_id = auth.uid();
end;
$$ language plpgsql security definer;

-- Function to create a todo (for Edge Function)
create or replace function create_todo(
  p_title text,
  p_completed boolean default false
)
returns todos as $$
declare
  v_todo todos;
begin
  insert into public.todos (user_id, title, completed)
  values (auth.uid(), p_title, p_completed)
  returning * into v_todo;
  return v_todo;
end;
$$ language plpgsql security definer;

-- Function to update a todo (for Edge Function)
create or replace function update_todo(
  p_id uuid,
  p_title text,
  p_completed boolean
)
returns todos as $$
declare
  v_todo todos;
begin
  update public.todos
  set title = p_title, completed = p_completed
  where id = p_id and user_id = auth.uid()
  returning * into v_todo;
  return v_todo;
end;
$$ language plpgsql security definer;

-- Function to delete a todo (for Edge Function)
create or replace function delete_todo(p_id uuid)
returns void as $$
begin
  delete from public.todos
  where id = p_id and user_id = auth.uid();
end;
$$ language plpgsql security definer;
