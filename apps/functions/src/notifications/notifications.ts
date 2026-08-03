/**
 * ServeSA Phase-1: Notifications Module
 * This module handles push notifications, email notifications, and FCM
 */

import { getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'

const db = getFirestore()
const messaging = getMessaging()


interface NotificationData {
  userId: string
  title: string
  body: string
  type: 'case_acknowledgment' | 'status_update' | 'new_case' | 'sla_breach' | 'general'
  data?: Record<string, any>
  priority?: 'high' | 'normal'
  imageUrl?: string
}

interface PushNotification {
  token: string
  notification: {
    title: string
    body: string
    imageUrl?: string
  }
  data?: Record<string, string>
  android?: {
    priority: 'high' | 'normal'
    notification: {
      channelId: string
      priority: 'high' | 'normal'
    }
  }
  apns?: {
    payload: {
      aps: {
        alert: {
          title: string
          body: string
        }
        badge: number
        sound: string
      }
    }
  }
}

/**
 * Send notification to user
 */
export async function sendNotification(notificationData: NotificationData): Promise<void> {
  try {
    // Get user's FCM token
    const userDoc = await db.collection('users').doc(notificationData.userId).get()
    if (!userDoc.exists) {
      console.warn(`User ${notificationData.userId} not found`)
      return
    }

    const userData = userDoc.data()
    const fcmToken = userData?.fcmToken

    if (!fcmToken) {
      console.warn(`No FCM token for user ${notificationData.userId}`)
      return
    }

    // Create push notification
    const pushNotification: PushNotification = {
      token: fcmToken,
      notification: {
        title: notificationData.title,
        body: notificationData.body,
        imageUrl: notificationData.imageUrl
      },
      data: {
        type: notificationData.type,
        ...notificationData.data
      },
      android: notificationData.priority === 'high' ? {
        priority: 'high',
        notification: {
          channelId: 'servesa_notifications',
          priority: 'high'
        }
      } : {
        priority: 'normal',
        notification: {
          channelId: 'servesa_notifications',
          priority: 'normal'
        }
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: notificationData.title,
              body: notificationData.body
            },
            badge: 1,
            sound: 'default'
          }
        }
      }
    }

    // Send push notification
    const response = await messaging.send(pushNotification as any)
    console.log(`Push notification sent to ${notificationData.userId}: ${response}`)

    // Store notification in Firestore
    await storeNotification(notificationData)

  } catch (error) {
    console.error('Error sending notification:', error)
    throw error
  }
}

/**
 * Send notification to multiple users
 */
export async function sendBulkNotifications(notifications: NotificationData[]): Promise<void> {
  try {
    const promises = notifications.map(notification => sendNotification(notification))
    await Promise.allSettled(promises)
  } catch (error) {
    console.error('Error sending bulk notifications:', error)
    throw error
  }
}

/**
 * Send notification to users by role and municipality
 */
export async function sendNotificationsByRole(
  role: string,
  municipalityId: string,
  notificationData: Omit<NotificationData, 'userId'>
): Promise<void> {
  try {
    const usersSnapshot = await db.collection('users')
      .where('role', '==', role)
      .where('municipalityId', '==', municipalityId)
      .get()

    const notifications: NotificationData[] = usersSnapshot.docs.map(doc => ({
      ...notificationData,
      userId: doc.id
    }))

    await sendBulkNotifications(notifications)
  } catch (error) {
    console.error('Error sending notifications by role:', error)
    throw error
  }
}

/**
 * Store notification in Firestore
 */
async function storeNotification(notificationData: NotificationData): Promise<void> {
  try {
    const notificationDoc = {
      userId: notificationData.userId,
      title: notificationData.title,
      body: notificationData.body,
      type: notificationData.type,
      data: notificationData.data || {},
      priority: notificationData.priority || 'normal',
      imageUrl: notificationData.imageUrl,
      read: false,
      createdAt: new Date(),
      sentAt: new Date()
    }

    await db.collection('notifications').add(notificationDoc)
  } catch (error) {
    console.error('Error storing notification:', error)
    // Don't throw - notification storage failure shouldn't break the main flow
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
  try {
    const notificationRef = db.collection('notifications').doc(notificationId)
    const notificationDoc = await notificationRef.get()

    if (!notificationDoc.exists) {
      throw new Error('Notification not found')
    }

    const notificationData = notificationDoc.data()
    if (notificationData?.userId !== userId) {
      throw new Error('Access denied')
    }

    await notificationRef.update({
      read: true,
      readAt: new Date()
    })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    throw error
  }
}

/**
 * Get user's notifications
 */
export async function getUserNotifications(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<any[]> {
  try {
    const notificationsSnapshot = await db.collection('notifications')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset)
      .get()

    return notificationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error getting user notifications:', error)
    throw error
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const unreadSnapshot = await db.collection('notifications')
      .where('userId', '==', userId)
      .where('read', '==', false)
      .get()

    return unreadSnapshot.size
  } catch (error) {
    console.error('Error getting unread notification count:', error)
    throw error
  }
}

/**
 * Send SLA breach notifications
 */
export async function sendSLABreachNotifications(caseData: any): Promise<void> {
  try {
    const notificationData: Omit<NotificationData, 'userId'> = {
      title: 'SLA Breach Alert',
      body: `Case "${caseData.title}" has breached its SLA target`,
      type: 'sla_breach',
      priority: 'high',
      data: {
        caseId: caseData.caseId,
        category: caseData.category,
        priority: caseData.priority
      }
    }

    // Send to municipality officials
    await sendNotificationsByRole('official', caseData.location.municipalityId, notificationData)
    await sendNotificationsByRole('admin', caseData.location.municipalityId, notificationData)

    // Send to case owner if different from officials
    if (caseData.userId) {
      await sendNotification({
        ...notificationData,
        userId: caseData.userId
      })
    }
  } catch (error) {
    console.error('Error sending SLA breach notifications:', error)
    throw error
  }
}

/**
 * Send case status update notifications
 */
export async function sendStatusUpdateNotifications(
  caseData: any,
  newStatus: string,
  updatedBy: string
): Promise<void> {
  try {
    const statusMessages = {
      acknowledged: 'Your case has been acknowledged and is being processed',
      assigned: 'Your case has been assigned to a department',
      in_progress: 'Work has begun on resolving your case',
      resolved: 'Your case has been resolved',
      reopened: 'Your case has been reopened due to new issues'
    }

    const message = statusMessages[newStatus as keyof typeof statusMessages] || 'Your case status has been updated'

    const notificationData: Omit<NotificationData, 'userId'> = {
      title: 'Case Status Updated',
      body: message,
      type: 'status_update',
      data: {
        caseId: caseData.caseId,
        status: newStatus,
        updatedBy
      }
    }

    // Send to case owner
    if (caseData.userId && caseData.userId !== updatedBy) {
      await sendNotification({
        ...notificationData,
        userId: caseData.userId
      })
    }

    // Send to municipality officials if status is resolved
    if (newStatus === 'resolved') {
      await sendNotificationsByRole('official', caseData.location.municipalityId, {
        ...notificationData,
        title: 'Case Resolved',
        body: `Case "${caseData.title}" has been resolved`
      })
    }
  } catch (error) {
    console.error('Error sending status update notifications:', error)
    throw error
  }
}

/**
 * Update user's FCM token
 */
export async function updateFCMToken(userId: string, fcmToken: string): Promise<void> {
  try {
    await db.collection('users').doc(userId).update({
      fcmToken,
      fcmTokenUpdatedAt: new Date()
    })
  } catch (error) {
    console.error('Error updating FCM token:', error)
    throw error
  }
}

/**
 * Remove user's FCM token
 */
export async function removeFCMToken(userId: string): Promise<void> {
  try {
    await db.collection('users').doc(userId).update({
      fcmToken: null,
      fcmTokenUpdatedAt: new Date()
    })
  } catch (error) {
    console.error('Error removing FCM token:', error)
    throw error
  }
}
