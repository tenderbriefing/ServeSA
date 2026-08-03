import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface Notification {
  id: string
  userId: string
  type: 'case_update' | 'message' | 'system' | 'community' | 'reminder'
  title: string
  message: string
  data?: any
  read: boolean
  createdAt: Date
  priority: 'low' | 'medium' | 'high' | 'urgent'
  actionUrl?: string
}

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      return
    }

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsData: Notification[] = []
      let unread = 0

      snapshot.docs.forEach((docSnapshot) => {
        const data = docSnapshot.data()
        const notification: Notification = {
          id: docSnapshot.id,
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data,
          read: data.read || false,
          createdAt: data.createdAt?.toDate() || new Date(),
          priority: data.priority || 'medium',
          actionUrl: data.actionUrl
        }
        
        notificationsData.push(notification)
        if (!notification.read) unread++
      })

      setNotifications(notificationsData)
      setUnreadCount(unread)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  const markAsRead = async (notificationId: string) => {
    if (!user) return

    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
        readAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!user) return

    try {
      const unreadNotifications = notifications.filter(n => !n.read)
      const updatePromises = unreadNotifications.map(notification =>
        updateDoc(doc(db, 'notifications', notification.id), {
          read: true,
          readAt: serverTimestamp()
        })
      )
      await Promise.all(updatePromises)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const createNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    if (!user) return

    try {
      await addDoc(collection(db, 'notifications'), {
        ...notification,
        userId: user.uid,
        read: false,
        createdAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error creating notification:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    if (!user) return

    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        deleted: true,
        deletedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    createNotification,
    deleteNotification
  }
}
