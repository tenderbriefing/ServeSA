import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { auth } from '@/lib/firebase';

// Notifications API
export class NotificationsAPI {
  private static instance: NotificationsAPI;
  private messaging: any = null;
  
  public static getInstance(): NotificationsAPI {
    if (!NotificationsAPI.instance) {
      NotificationsAPI.instance = new NotificationsAPI();
    }
    return NotificationsAPI.instance;
  }

  /**
   * Initialize FCM and request permission
   */
  async initializeFCM() {
    try {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        this.messaging = getMessaging();
        
        // Request permission
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // Get FCM token
          const token = await getToken(this.messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FCM_VAPID_KEY
          });
          
          if (token) {
            await this.registerFCMToken(token);
            console.log('FCM token registered:', token);
          }
        }
      }
    } catch (error) {
      console.error('Error initializing FCM:', error);
    }
  }

  /**
   * Register FCM token for user
   */
  async registerFCMToken(token: string) {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const registerTokenFunction = httpsCallable(functions, 'registerFCMTokenFunction');
      await registerTokenFunction({
        userId: user.uid,
        token
      });
    } catch (error) {
      console.error('Error registering FCM token:', error);
    }
  }

  /**
   * Unregister FCM token for user
   */
  async unregisterFCMToken(token: string) {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const unregisterTokenFunction = httpsCallable(functions, 'unregisterFCMTokenFunction');
      await unregisterTokenFunction({
        userId: user.uid,
        token
      });
    } catch (error) {
      console.error('Error unregistering FCM token:', error);
    }
  }

  /**
   * Send push notification
   */
  async sendPushNotification(notificationData: {
    userId: string;
    title: string;
    body: string;
    type: 'case_acknowledgment' | 'status_update' | 'new_case' | 'sla_breach' | 'general';
    data?: Record<string, any>;
  }) {
    try {
      const sendNotificationFunction = httpsCallable(functions, 'sendPushNotificationFunction');
      const result = await sendNotificationFunction(notificationData);
      return result.data;
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw new Error('Failed to send notification.');
    }
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(emailData: {
    to: string;
    subject: string;
    htmlContent: string;
    textContent?: string;
    type: 'case_acknowledgment' | 'status_update' | 'sla_breach' | 'general';
  }) {
    try {
      const sendEmailFunction = httpsCallable(functions, 'sendEmailNotificationFunction');
      const result = await sendEmailFunction(emailData);
      return result.data;
    } catch (error) {
      console.error('Error sending email notification:', error);
      throw new Error('Failed to send email notification.');
    }
  }

  /**
   * Get notification history
   */
  async getNotificationHistory(userId: string, limit: number = 50) {
    try {
      const getHistoryFunction = httpsCallable(functions, 'getNotificationHistoryFunction');
      const result = await getHistoryFunction({ userId, limit });
      return result.data;
    } catch (error) {
      console.error('Error getting notification history:', error);
      throw new Error('Failed to load notification history.');
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string) {
    try {
      const markReadFunction = httpsCallable(functions, 'markNotificationAsReadFunction');
      const result = await markReadFunction({ notificationId });
      return result.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read.');
    }
  }

  /**
   * Set up message listener for foreground notifications
   */
  setupMessageListener() {
    if (this.messaging) {
      onMessage(this.messaging, (payload) => {
        console.log('Message received:', payload);
        
        // Show notification
        if (payload.notification) {
          const notification = new Notification(payload.notification.title || 'ServeSA', {
            body: payload.notification.body,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: payload.data?.caseId || 'servesa-notification',
            data: payload.data
          });

          notification.onclick = () => {
            window.focus();
            if (payload.data?.actionUrl) {
              window.location.href = payload.data.actionUrl;
            }
            notification.close();
          };
        }
      });
    }
  }

  /**
   * Check if notifications are supported
   */
  isNotificationSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Check if notifications are permitted
   */
  getNotificationPermission(): NotificationPermission {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'denied';
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return await Notification.requestPermission();
    }
    return 'denied';
  }
}

// Export singleton instance
export const notificationsAPI = NotificationsAPI.getInstance();
