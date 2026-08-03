import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from './useAuth'
import type { Message, Conversation, Department } from '@/types/messaging'

export function useMessaging() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch conversations
  useEffect(() => {
    if (!user) return

    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageTime', 'desc')
    )

    const unsubscribe = onSnapshot(conversationsQuery, async (snapshot) => {
      const conversationsData: Conversation[] = []
      
      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data()
        const otherParticipantId = data.participants.find((id: string) => id !== user.uid)
        
        if (otherParticipantId) {
          const userDocRef = doc(db, 'users', otherParticipantId)
          const userDoc = await getDoc(userDocRef)
          const userData = userDoc.data()
          
          conversationsData.push({
            id: docSnapshot.id,
            participants: data.participants,
            lastMessage: data.lastMessage,
            lastMessageTime: data.lastMessageTime?.toDate() || new Date(),
            unreadCount: data.unreadCount || {},
            participantNames: [userData?.firstName + ' ' + userData?.lastName || 'Unknown User'],
            participantTypes: [userData?.userType || 'citizen'],
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          })
        }
      }
      
      setConversations(conversationsData)
    })

    return () => unsubscribe()
  }, [user])

  // Fetch departments
  useEffect(() => {
    const departmentsQuery = query(collection(db, 'departments'))
    
    const unsubscribe = onSnapshot(departmentsQuery, (snapshot) => {
      const departmentsData: Department[] = []
      
      snapshot.docs.forEach((docSnapshot) => {
        const data = docSnapshot.data()
        departmentsData.push({
          id: docSnapshot.id,
          name: data.name,
          description: data.description,
          category: data.category,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          staffCount: data.staffCount || 0,
          responseTime: data.responseTime || '24-48 hours',
          isOnline: data.isOnline || false,
          workingHours: data.workingHours || 'Mon-Fri 8AM-5PM',
          services: data.services || [],
        })
      })
      
      setDepartments(departmentsData)
    })

    return () => unsubscribe()
  }, [])

  const sendMessage = async (conversationId: string, content: string) => {
    if (!user || !content.trim()) return

    setLoading(true)
    try {
      const conversation = conversations.find(c => c.id === conversationId)
      if (!conversation) return

      const otherParticipantId = conversation.participants.find(id => id !== user.uid)
      if (!otherParticipantId) return

      const userDocRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userDocRef)
      const userData = userDoc.data()

      await addDoc(collection(db, 'messages'), {
        conversationId,
        senderId: user.uid,
        receiverId: otherParticipantId,
        content: content.trim(),
        timestamp: serverTimestamp(),
        read: false,
        senderName: userData?.firstName + ' ' + userData?.lastName || 'Unknown User',
        senderType: userData?.userType || 'citizen'
      })

      // Update conversation
      await addDoc(collection(db, 'conversations'), {
        id: conversationId,
        lastMessage: content.trim(),
        lastMessageTime: serverTimestamp(),
        [`unreadCount.${otherParticipantId}`]: (conversation.unreadCount[otherParticipantId] || 0) + 1
      })
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setLoading(false)
    }
  }

  const startConversation = async (departmentId: string) => {
    if (!user) return

    setLoading(true)
    try {
      const conversationData = {
        participants: [user.uid, departmentId],
        lastMessage: '',
        lastMessageTime: serverTimestamp(),
        unreadCount: {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, 'conversations'), conversationData)
      return docRef.id
    } catch (error) {
      console.error('Error starting conversation:', error)
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    conversations,
    messages,
    departments,
    loading,
    sendMessage,
    startConversation,
  }
}
