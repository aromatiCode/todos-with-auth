// src/components/LocalReminderChecker/LocalReminderChecker.jsx
// Local reminder checker for testing without deploying Edge Function
// This component runs in the browser and checks for due reminders

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { showLocalNotification, getNotificationPermission, requestNotificationPermission, playNotificationSound } from '../../lib/notifications';

export default function LocalReminderChecker({ userId, enabled = true }) {
  const [lastCheck, setLastCheck] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Check notification permission on mount
    setNotificationPermission(getNotificationPermission());

    if (!enabled || !userId) return;

    // Check for due reminders every 30 seconds
    const checkReminders = async () => {
      try {
        const now = new Date().toISOString();
        
        const { data: pendingReminders, error } = await supabase
          .from('todos')
          .select('id, title, reminder_at, notification_sent')
          .eq('user_id', userId)
          .eq('completed', false)
          .lte('reminder_at', now)
          .eq('notification_sent', false)
          .not('reminder_at', 'is', null);

        if (error) {
          console.error('Error checking reminders:', error);
          return;
        }

        if (pendingReminders && pendingReminders.length > 0) {
          console.log(`Found ${pendingReminders.length} pending reminder(s)`);
          
          // Play notification sound for each reminder
          playNotificationSound();
          
          // Show browser notification for each reminder
          for (const todo of pendingReminders) {
            showLocalNotification(
              'Todo Reminder',
              todo.title,
              {
                tag: todo.id,
                onClick: () => window.location.href = '/todos'
              }
            );
          }

          // Mark notifications as sent
          for (const todo of pendingReminders) {
            await supabase
              .from('todos')
              .update({ notification_sent: true })
              .eq('id', todo.id);
          }
        }

        setLastCheck(new Date());
      } catch (err) {
        console.error('Error in reminder checker:', err);
      }
    };

    // Initial check
    checkReminders();

    // Set up interval
    intervalRef.current = setInterval(checkReminders, 30000); // Check every 30 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [userId, enabled]);

  const handleRequestPermission = async () => {
    const permission = await requestNotificationPermission();
    setNotificationPermission(permission);
  };

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: '#fff',
      padding: '10px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '200px'
    }}>
      <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
        Local Reminder Checker
      </div>
      <div style={{ marginBottom: '8px' }}>
        Last check: {lastCheck ? lastCheck.toLocaleTimeString() : 'Never'}
      </div>
      <div style={{ marginBottom: '8px' }}>
        Status: {notificationPermission === 'granted' ? 'Enabled' : 'Disabled'}
      </div>
      {notificationPermission !== 'granted' && (
        <button
          onClick={handleRequestPermission}
          style={{
            background: '#667eea',
            color: '#fff',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          Enable Notifications
        </button>
      )}
    </div>
  );
}