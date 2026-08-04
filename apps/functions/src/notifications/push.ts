import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

interface PushNotificationData {
  userId: string;
  title: string;
  body: string;
  type: 'case_acknowledgment' | 'status_update' | 'new_case' | 'sla_breach' | 'case_assignment' | 'sla_warning' | 'general';
  data?: Record<string, any>;
  imageUrl?: string;
  actionUrl?: string;
}

interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send push notification to a specific user
 */
export const sendPushNotification = async (notificationData: PushNotificationData): Promise<NotificationResult> => {
  try {
    // Get user's FCM tokens
    const userDoc = await db.collection('users').doc(notificationData.userId).get();
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const fcmTokens = userData?.fcmTokens || [];

    if (fcmTokens.length === 0) {
      console.log(`No FCM tokens found for user ${notificationData.userId}`);
      return { success: false, error: 'No FCM tokens found' };
    }

    // Prepare notification payload
    const payload: admin.messaging.MulticastMessage = {
      notification: {
        title: notificationData.title,
        body: notificationData.body,
        imageUrl: notificationData.imageUrl
      },
      data: {
        type: notificationData.type,
        actionUrl: notificationData.actionUrl || '',
        ...notificationData.data
      },
      tokens: fcmTokens,
      android: {
        notification: {
          icon: 'ic_notification',
          color: '#2196F3',
          sound: 'default',
          channelId: 'servesa_notifications'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    // Send notification
    const response = await admin.messaging().sendMulticast(payload);

    // Handle failed tokens
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(fcmTokens[idx]);
          console.error(`Failed to send notification to token ${fcmTokens[idx]}:`, resp.error);
        }
      });

      // Remove failed tokens from user's FCM tokens
      if (failedTokens.length > 0) {
        await removeFailedTokens(notificationData.userId, failedTokens);
      }
    }

    // Log notification
    await logNotification(notificationData, response.successCount, response.failureCount);

    return {
      success: response.successCount > 0,
      messageId: response.responses[0]?.messageId
    };

  } catch (error) {
    console.error('Error sending push notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Send push notification to multiple users
 */
export const sendBulkPushNotification = async (
  userIds: string[],
  title: string,
  body: string,
  type: string,
  data?: Record<string, any>
): Promise<NotificationResult> => {
  try {
    const results = await Promise.allSettled(
      userIds.map(userId => 
        sendPushNotification({
          userId,
          title,
          body,
          type: type as any,
          data
        })
      )
    );

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    void (results.length - successCount);

    return {
      success: successCount > 0,
      messageId: `bulk_${Date.now()}`
    };

  } catch (error) {
    console.error('Error sending bulk push notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Send notification to all users in a municipality
 */
export const sendMunicipalityNotification = async (
  municipalityId: string,
  title: string,
  body: string,
  type: string,
  data?: Record<string, any>
): Promise<NotificationResult> => {
  try {
    // Get all users in the municipality
    const usersSnapshot = await db.collection('users')
      .where('municipalityId', '==', municipalityId)
      .where('notificationsEnabled', '==', true)
      .get();

    const userIds = usersSnapshot.docs.map(doc => doc.id);

    if (userIds.length === 0) {
      return { success: false, error: 'No users found in municipality' };
    }

    return await sendBulkPushNotification(userIds, title, body, type, data);

  } catch (error) {
    console.error('Error sending municipality notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Send notification to all officials in a municipality
 */
export const sendOfficialNotification = async (
  municipalityId: string,
  title: string,
  body: string,
  type: string,
  data?: Record<string, any>
): Promise<NotificationResult> => {
  try {
    // Get all officials in the municipality
    const officialsSnapshot = await db.collection('users')
      .where('municipalityId', '==', municipalityId)
      .where('role', 'in', ['official', 'admin'])
      .where('notificationsEnabled', '==', true)
      .get();

    const userIds = officialsSnapshot.docs.map(doc => doc.id);

    if (userIds.length === 0) {
      return { success: false, error: 'No officials found in municipality' };
    }

    return await sendBulkPushNotification(userIds, title, body, type, data);

  } catch (error) {
    console.error('Error sending official notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Remove failed FCM tokens from user's profile
 */
async function removeFailedTokens(userId: string, failedTokens: string[]): Promise<void> {
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      const currentTokens = userData?.fcmTokens || [];
      const updatedTokens = currentTokens.filter((token: string) => !failedTokens.includes(token));
      
      await userRef.update({
        fcmTokens: updatedTokens,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error removing failed tokens:', error);
  }
}

/**
 * Log notification for analytics
 */
async function logNotification(
  notificationData: PushNotificationData,
  successCount: number,
  failureCount: number
): Promise<void> {
  try {
    await db.collection('notification_logs').add({
      userId: notificationData.userId,
      title: notificationData.title,
      body: notificationData.body,
      type: notificationData.type,
      data: notificationData.data,
      successCount,
      failureCount,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error logging notification:', error);
  }
}

/**
 * Register FCM token for a user
 */
export const registerFCMToken = async (userId: string, token: string): Promise<void> => {
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      const currentTokens = userData?.fcmTokens || [];
      
      if (!currentTokens.includes(token)) {
        await userRef.update({
          fcmTokens: [...currentTokens, token],
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }
  } catch (error) {
    console.error('Error registering FCM token:', error);
    throw error;
  }
};

/**
 * Unregister FCM token for a user
 */
export const unregisterFCMToken = async (userId: string, token: string): Promise<void> => {
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      const currentTokens = userData?.fcmTokens || [];
      const updatedTokens = currentTokens.filter((t: string) => t !== token);
      
      await userRef.update({
        fcmTokens: updatedTokens,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error unregistering FCM token:', error);
    throw error;
  }
};
