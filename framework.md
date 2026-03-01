# Supabase Todo App Framework
### Repository: todos-with-auth

---

# 1. Project Goal

Transform the existing localStorage-based Todo app into a fully backend-powered application using Supabase.

The upgraded version will include:

- Supabase Authentication (email/password)
- PostgreSQL database for todos
- Row Level Security (RLS)
- Secure per-user data isolation
- Deployment-ready architecture (Vercel + Supabase)

---

# 2. Architecture Overview

Frontend: React  
Backend: Supabase (Auth + Database)  
Hosting: Vercel  

Flow:

React UI  
↓  
Supabase Client  
↓  
Supabase Auth  
↓  
Supabase Database (todos table)  
↓  
Row Level Security (per-user isolation)

---

# 3. Supabase Setup

## 3.1 Create Supabase Project

1. Go to Supabase Dashboard
2. Create new project
3. Save:
   - Project URL
   - Anon Public Key

---

# 4. Database Schema

Run this SQL inside Supabase SQL Editor:

```sql
create table todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null,
  completed boolean default false,
  created_at timestamp with time zone default now()
);

alter table todos enable row level security;

create policy "Users can view their own todos"
on todos for select
using (auth.uid() = user_id);

create policy "Users can insert their own todos"
on todos for insert
with check (auth.uid() = user_id);

create policy "Users can update their own todos"
on todos for update
using (auth.uid() = user_id);

create policy "Users can delete their own todos"
on todos for delete
using (auth.uid() = user_id);

---

# 5. Calendar Reminder & Push Notifications

## 5.1 Updated Database Schema

Add reminder fields to support scheduled notifications:

```sql
-- Add reminder columns to todos table
alter table todos add column if not exists reminder_at timestamp with time zone;
alter table todos add column if not exists notification_sent boolean default false;

-- Create index for efficient querying of pending reminders
create index if not exists idx_todos_pending_reminders 
on todos (reminder_at) 
where reminder_at is not null and notification_sent = false;
```

---

## 5.2 Supabase Edge Function for Reminder Triggers

Create an Edge Function that runs on a schedule (via cron) to check for due reminders:

```typescript
// supabase/functions/check-reminders/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Firebase Cloud Messaging - replace with your config
const fcmServerKey = Deno.env.get("FCM_SERVER_KEY")!;

serve(async (req) => {
  try {
    // Find todos with pending reminders that are due
    const now = new Date().toISOString();
    
    const { data: pendingReminders, error } = await supabase
      .from("todos")
      .select("id, title, user_id, reminder_at")
      .lte("reminder_at", now)
      .eq("notification_sent", false)
      .not("reminder_at", "is", null);

    if (error) throw error;
    if (!pendingReminders?.length) {
      return new Response(JSON.stringify({ message: "No pending reminders" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Process each reminder
    for (const todo of pendingReminders) {
      // Get user's FCM token from user metadata
      const { data: userData } = await supabase.auth.admin.getUserById(todo.user_id);
      const fcmToken = userData?.user?.user_metadata?.fcm_token;

      if (fcmToken) {
        // Send push notification via FCM
        await sendPushNotification(fcmToken, {
          title: "📅 Todo Reminder",
          body: todo.title,
          icon: "/icon.png",
          click_action: "/todos",
        });
      }

      // Mark notification as sent
      await supabase
        .from("todos")
        .update({ notification_sent: true })
        .eq("id", todo.id);
    }

    return new Response(JSON.stringify({ processed: pendingReminders.length }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(error.message, { status: 500 });
  }
});

async function sendPushNotification(token: string, notification: any) {
  await fetch("https://fcm.googleapis.com/fcm/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `key=${fcmServerKey}`,
    },
    body: JSON.stringify({
      to: token,
      notification,
    }),
  });
}
```

---

## 5.3 Setting Up Scheduled Triggers

### Option A: Supabase Cron (recommended)

Add to Supabase Edge Function schedule:

```json
// supabase/functions/check-reminders/config.json
{
  "verify_jwt": false
}
```

Deploy with schedule:
```bash
supabase functions deploy check-reminders --no-verify-jwt
```

Then enable in Supabase Dashboard:
- Go to Edge Functions → your function → Schedule
- Set cron: `*/5 * * * *` (every 5 minutes)

### Option B: External Cron Service

Use Vercel Cron or another cron service to call the Edge Function endpoint every few minutes.

---

## 5.4 Frontend Changes

### Add reminder picker to TodoItem:

```jsx
// In TodoItem.jsx
import { DateTimePicker } from '@mui/x-date-pickers';

function TodoItem({ todo, onUpdate, onDelete }) {
  const [reminder, setReminder] = useState(todo.reminder_at);

  const handleReminderChange = async (newDate) => {
    setReminder(newDate);
    await onUpdate(todo.id, { reminder_at: newDate?.toISOString() });
  };

  return (
    <div className="todo-item">
      {/* ... existing code ... */}
      <DateTimePicker
        value={reminder ? parseISO(reminder) : null}
        onChange={handleReminderChange}
        label="Reminder"
        minDateTime={new Date()}
      />
    </div>
  );
}
```

### Request push notification permission:

```jsx
// In App.js or AuthContext
async function requestNotificationPermission() {
  if (!("Notification" in window)) return;
  
  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    const token = await getFcmToken(); // Implement FCM token retrieval
    // Save token to user metadata
    await updateUserMetadata({ fcm_token: token });
  }
}
```

---

## 5.5 Required Environment Variables

```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Firebase Cloud Messaging
FCM_SERVER_KEY=your_firebase_server_key
```

---

# 6. Deployment

Deploy to Vercel:

```bash
npm install -g vercel
vercel
```

Configure environment variables in Vercel dashboard.

---

# 7. Testing

1. Create a todo with a reminder 1 minute in the future
2. Wait for the cron job to trigger
3. Check browser notification appears
4. Verify `notification_sent` is set to true in database