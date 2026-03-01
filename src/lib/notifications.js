// src/lib/notifications.js
// Push notification service for handling browser notifications

/**
 * Play a notification sound using Web Audio API
 */
export function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Set sound parameters
    oscillator.frequency.value = 800; // Hz
    oscillator.type = 'sine';
    
    // Create a pleasant chime-like sound
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
    
    // Play a second tone for a more noticeable sound
    setTimeout(() => {
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.frequency.value = 1000;
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      osc2.start(audioContext.currentTime);
      osc2.stop(audioContext.currentTime + 0.5);
    }, 200);
    
    console.log('[Notifications] Sound played');
  } catch (e) {
    console.error('[Notifications] Error playing sound:', e);
  }
}

/**
 * Check if browser supports push notifications
 */
export function isPushNotificationSupported() {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Request notification permission from the user
 * @returns {Promise<NotificationPermission>} The permission status
 */
export async function requestNotificationPermission() {
  if (!isPushNotificationSupported()) {
    console.log('Push notifications are not supported in this browser');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    console.log('Notification permission already granted');
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission;
  }

  return Notification.permission;
}

/**
 * Show a local browser notification
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} options - Additional notification options
 */
export function showLocalNotification(title, body, options = {}) {
  console.log('[Notifications] Attempting to show:', { title, body, permission: Notification?.permission });
  
  // Play notification sound
  if (options.playSound !== false) {
    playNotificationSound();
  }
  
  if (!isPushNotificationSupported()) {
    console.log('[Notifications] Not supported');
    return null;
  }

  if (Notification.permission !== 'granted') {
    console.log('[Notifications] Permission not granted:', Notification.permission);
    return null;
  }

  try {
    const notification = new Notification(title, {
      body,
      icon: options.icon || '/favicon.ico',
      badge: options.badge || '/favicon.ico',
      tag: options.tag || 'todo-reminder',
      renotify: options.renotify !== false,
      requireInteraction: false,
      data: options.data || {},
      ...options
    });

    notification.onclick = () => {
      window.focus();
      if (options.onClick) options.onClick();
      notification.close();
    };

    notification.onerror = (e) => console.error('[Notifications] Error:', e);
    notification.onshow = () => console.log('[Notifications] Shown successfully');
    
    console.log('[Notifications] Created OK');
    return notification;
  } catch (e) {
    console.error('[Notifications] Exception:', e);
    return null;
  }
}

/**
 * Request notification permission and show a test notification
 */
export async function enableNotifications() {
  const permission = await requestNotificationPermission();
  
  if (permission === 'granted') {
    // Show a welcome notification
    showLocalNotification(
      'Notifications Enabled 🔔',
      'You will receive reminders for your todos!',
      { tag: 'welcome-notification' }
    );
    return true;
  }
  
  return false;
}

/**
 * Check current notification permission status
 */
export function getNotificationPermission() {
  if (!isPushNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
}

// Local storage key for storing pending local notifications (for testing)
const LOCAL_NOTIFICATIONS_KEY = 'todo_pending_notifications';

/**
 * Store a local notification for testing (when FCM is not available)
 */
export function storeLocalNotification(notification) {
  const notifications = getLocalNotifications();
  notifications.push({
    ...notification,
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  });
  localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(notifications));
}

/**
 * Get all pending local notifications
 */
export function getLocalNotifications() {
  const stored = localStorage.getItem(LOCAL_NOTIFICATIONS_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Clear all local notifications
 */
export function clearLocalNotifications() {
  localStorage.removeItem(LOCAL_NOTIFICATIONS_KEY);
}

/**
 * Show any pending local notifications (for testing without FCM)
 */
export function showPendingLocalNotifications() {
  const notifications = getLocalNotifications();
  
  notifications.forEach(notification => {
    showLocalNotification(
      notification.title || 'Todo Reminder',
      notification.body || notification.title,
      { tag: notification.id }
    );
  });
  
  // Clear after showing
  clearLocalNotifications();
  
  return notifications.length;
}
