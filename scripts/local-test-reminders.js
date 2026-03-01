// todo-app/scripts/local-test-reminders.js
// Local testing script to trigger reminder checks without deploying to Supabase
// Run with: node scripts/local-test-reminders.js

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in .env file');
  console.log('Please add the following to your .env file:');
  console.log('REACT_APP_SUPABASE_URL=your_supabase_url');
  console.log('REACT_APP_SUPABASE_ANON_KEY=your_anon_key');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey || supabaseKey);

async function checkReminders() {
  console.log('🔔 Checking for pending reminders...\n');
  
  const now = new Date().toISOString();
  
  // Find todos with pending reminders that are due
  const { data: pendingReminders, error } = await supabase
    .from('todos')
    .select('id, title, user_id, reminder_at, notification_sent')
    .lte('reminder_at', now)
    .eq('notification_sent', false)
    .not('reminder_at', 'is', null);
  
  if (error) {
    console.error('Error fetching pending reminders:', error);
    return;
  }
  
  if (!pendingReminders || pendingReminders.length === 0) {
    console.log('✅ No pending reminders found.');
    return;
  }
  
  console.log(`Found ${pendingReminders.length} pending reminder(s):\n`);
  
  // Process each reminder
  for (const todo of pendingReminders) {
    console.log(`📅 Todo: "${todo.title}"`);
    console.log(`   Reminder time: ${new Date(todo.reminder_at).toLocaleString()}`);
    console.log(`   Current time: ${new Date(now).toLocaleString()}`);
    
    // For local testing without FCM, we'll store in localStorage
    // In production, this would send push notification via FCM
    
    // Mark notification as sent in database
    const { error: updateError } = await supabase
      .from('todos')
      .update({ notification_sent: true })
      .eq('id', todo.id);
    
    if (updateError) {
      console.error(`   ❌ Error marking as sent:`, updateError);
    } else {
      console.log(`   ✅ Marked as sent in database`);
    }
    console.log('');
  }
  
  console.log(`✅ Processed ${pendingReminders.length} reminder(s)`);
}

// Run the check
checkReminders().catch(console.error);
