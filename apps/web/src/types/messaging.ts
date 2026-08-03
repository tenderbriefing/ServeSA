export interface Message {
  id: string
  conversationId: string
  senderId: string
  receiverId: string
  content: string
  timestamp: Date
  read: boolean
  senderName: string
  senderType: 'citizen' | 'department' | 'admin'
}

export interface Conversation {
  id: string
  participants: string[]
  lastMessage: string
  lastMessageTime: Date
  unreadCount: Record<string, number>
  participantNames: string[]
  participantTypes: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Department {
  id: string
  name: string
  description: string
  category: string
  contactEmail: string
  contactPhone: string
  staffCount: number
  responseTime: string
  isOnline: boolean
  workingHours: string
  services: string[]
}
