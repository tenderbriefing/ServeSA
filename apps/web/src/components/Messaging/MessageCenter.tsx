'use client'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { MessageSquare, Send, Search, Filter, MoreVertical, User, Building, Shield } from 'lucide-react'

interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  timestamp: any
  read: boolean
  senderName: string
  senderType: 'citizen' | 'department' | 'admin'
}

interface Conversation {
  id: string
  participants: string[]
  lastMessage: string
  lastMessageTime: any
  unreadCount: number
  participantNames: string[]
  participantTypes: string[]
}

export function MessageCenter() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'departments'>('all')
  const [isLoading, setIsLoading] = useState(false)

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
            lastMessageTime: data.lastMessageTime,
            unreadCount: data.unreadCount?.[user.uid] || 0,
            participantNames: [userData?.firstName + ' ' + userData?.lastName || 'Unknown User'],
            participantTypes: [userData?.userType || 'citizen']
          })
        }
      }
      
      setConversations(conversationsData)
    })

    return () => unsubscribe()
  }, [user])

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConversation || !user) return

    const messagesQuery = query(
      collection(db, 'messages'),
      where('conversationId', '==', selectedConversation),
      orderBy('timestamp', 'asc')
    )

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData: Message[] = []
      
      snapshot.docs.forEach((docSnapshot) => {
        const data = docSnapshot.data()
        messagesData.push({
          id: docSnapshot.id,
          senderId: data.senderId,
          receiverId: data.receiverId,
          content: data.content,
          timestamp: data.timestamp,
          read: data.read,
          senderName: data.senderName,
          senderType: data.senderType
        })
      })
      
      setMessages(messagesData)
    })

    return () => unsubscribe()
  }, [selectedConversation, user])

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return

    setIsLoading(true)
    try {
      const conversation = conversations.find(c => c.id === selectedConversation)
      if (!conversation) return

      const otherParticipantId = conversation.participants.find(id => id !== user.uid)
      if (!otherParticipantId) return

             const userDocRef = doc(db, 'users', user.uid)
       const userDoc = await getDoc(userDocRef)
       const userData = userDoc.data()

      await addDoc(collection(db, 'messages'), {
        conversationId: selectedConversation,
        senderId: user.uid,
        receiverId: otherParticipantId,
        content: newMessage.trim(),
        timestamp: serverTimestamp(),
        read: false,
        senderName: userData?.firstName + ' ' + userData?.lastName || 'Unknown User',
        senderType: userData?.userType || 'citizen'
      })

      // Update conversation
      await addDoc(collection(db, 'conversations'), {
        id: selectedConversation,
        lastMessage: newMessage.trim(),
        lastMessageTime: serverTimestamp(),
        [`unreadCount.${otherParticipantId}`]: (conversation.unreadCount || 0) + 1
      })

      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredConversations = conversations.filter(conversation => {
    const matchesSearch = conversation.participantNames.some(name => 
      name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    const matchesFilter = filterType === 'all' || 
      (filterType === 'unread' && conversation.unreadCount > 0) ||
      (filterType === 'departments' && conversation.participantTypes.includes('department'))
    
    return matchesSearch && matchesFilter
  })

  const getParticipantIcon = (type: string) => {
    switch (type) {
      case 'department':
        return <Building className="h-4 w-4" />
      case 'admin':
        return <Shield className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  return (
    <div className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          {t('messaging.title')}
        </CardTitle>
        <CardDescription>{t('messaging.description')}</CardDescription>
      </CardHeader>

      <div className="flex-1 flex gap-4 p-4">
        {/* Conversations List */}
        <div className="w-1/3 border-r pr-4">
          <div className="space-y-4">
            {/* Search and Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('messaging.searchConversations')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('all')}
                >
                  {t('messaging.all')}
                </Button>
                <Button
                  variant={filterType === 'unread' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('unread')}
                >
                  {t('messaging.unread')}
                </Button>
                <Button
                  variant={filterType === 'departments' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('departments')}
                >
                  {t('messaging.departments')}
                </Button>
              </div>
            </div>

            {/* Conversations */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedConversation === conversation.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setSelectedConversation(conversation.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getParticipantIcon(conversation.participantTypes[0])}
                      <div>
                        <div className="font-medium text-sm">
                          {conversation.participantNames[0]}
                        </div>
                        <div className="text-xs opacity-70 truncate">
                          {conversation.lastMessage}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs opacity-70">
                        {conversation.lastMessageTime?.toDate().toLocaleTimeString()}
                      </div>
                      {conversation.unreadCount > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Messages List */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderId === user?.uid
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="text-sm font-medium mb-1">
                        {message.senderName}
                      </div>
                      <div className="text-sm">{message.content}</div>
                      <div className="text-xs opacity-70 mt-1">
                        {message.timestamp?.toDate().toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="flex gap-2">
                <Input
                  placeholder={t('messaging.typeMessage')}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || !newMessage.trim()}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              {t('messaging.selectConversation')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

