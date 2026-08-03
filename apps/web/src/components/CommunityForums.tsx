'use client'

import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Textarea } from '@/components/ui/Textarea'
import { Input } from '@/components/ui/Input'
import { 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  Share2, 
  Flag,
  Users,
  Clock,
  TrendingUp
} from 'lucide-react'

interface ForumTopic {
  id: string
  title: string
  content: string
  author: string
  authorAvatar: string
  createdAt: string
  replies: number
  likes: number
  dislikes: number
  tags: string[]
  isPopular: boolean
  isRecent: boolean
}

interface ForumReply {
  id: string
  content: string
  author: string
  authorAvatar: string
  createdAt: string
  likes: number
  dislikes: number
}

export function CommunityForums() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'recent' | 'popular' | 'create'>('recent')
  const [newTopic, setNewTopic] = useState({ title: '', content: '', tags: '' })
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null)

  const [topics, setTopics] = useState<ForumTopic[]>([])
  const [loading, setLoading] = useState(true)

  // Load forum topics from Firestore
  useEffect(() => {
    const loadTopics = async () => {
      setLoading(true)
      try {
        const topicsQuery = query(
          collection(db, 'forumTopics'),
          orderBy('createdAt', 'desc')
        )
        
        const unsubscribe = onSnapshot(topicsQuery, (snapshot) => {
          const topicsData: ForumTopic[] = []
          
          snapshot.docs.forEach((docSnapshot) => {
            const data = docSnapshot.data()
            topicsData.push({
              id: docSnapshot.id,
              title: data.title,
              content: data.content,
              author: data.author,
              authorAvatar: data.authorAvatar || data.author?.substring(0, 2).toUpperCase(),
              createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
              replies: data.replies || 0,
              likes: data.likes || 0,
              dislikes: data.dislikes || 0,
              tags: data.tags || [],
              isPopular: data.likes > 20,
              isRecent: new Date(data.createdAt?.toDate() || new Date()).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
            })
          })
          
          setTopics(topicsData)
        })

        return () => unsubscribe()
      } catch (error) {
        console.error('Error loading forum topics:', error)
        // Fallback to default topics if Firestore fails
        const defaultTopics: ForumTopic[] = [
          {
            id: '1',
            title: 'Water issues in Ward 58 - need urgent attention',
            content: 'We have been experiencing water shortages for the past week. Multiple households affected. Has anyone else noticed this?',
            author: 'Sarah Mkhize',
            authorAvatar: 'SM',
            createdAt: '2024-01-15T10:30:00Z',
            replies: 12,
            likes: 45,
            dislikes: 2,
            tags: ['water', 'ward-58', 'urgent'],
            isPopular: true,
            isRecent: true
          },
          {
            id: '2',
            title: 'Street lighting improvements needed',
            content: 'The street lights on Oak Avenue are not working properly. It\'s very dark at night and unsafe for pedestrians.',
            author: 'David van der Merwe',
            authorAvatar: 'DV',
            createdAt: '2024-01-14T16:45:00Z',
            replies: 8,
            likes: 23,
            dislikes: 1,
            tags: ['lighting', 'safety', 'infrastructure'],
            isPopular: false,
            isRecent: true
          }
        ]
        setTopics(defaultTopics)
      } finally {
        setLoading(false)
      }
    }

    loadTopics()
  }, [])

  const replies: ForumReply[] = [
    {
      id: '1',
      content: 'Yes, I\'ve noticed the same issue. Called the municipality but no response yet.',
      author: 'Mike Wilson',
      authorAvatar: 'MW',
      createdAt: '2024-01-15T11:00:00Z',
      likes: 8,
      dislikes: 0
    },
    {
      id: '2',
      content: 'We should organize a community meeting to address this collectively.',
      author: 'Zanele Nkosi',
      authorAvatar: 'ZN',
      createdAt: '2024-01-15T11:30:00Z',
      likes: 12,
      dislikes: 1
    }
  ]

  const handleCreateTopic = () => {
    // In real app, this would submit to API
    console.log('Creating topic:', newTopic)
    setNewTopic({ title: '', content: '', tags: '' })
    setActiveTab('recent')
  }

  const handleLike = (topicId: string) => {
    // In real app, this would update via API
    console.log('Liked topic:', topicId)
  }

  const handleDislike = (topicId: string) => {
    // In real app, this would update via API
    console.log('Disliked topic:', topicId)
  }

  const handleReply = (topicId: string) => {
    setSelectedTopic(topics.find(t => t.id === topicId) || null)
  }

  const filteredTopics = topics.filter(topic => {
    if (activeTab === 'recent') return topic.isRecent
    if (activeTab === 'popular') return topic.isPopular
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('community.forums.title')}</h2>
          <p className="text-gray-600">{t('community.forums.description')}</p>
        </div>
        <Button onClick={() => setActiveTab('create')}>
          {t('community.forums.createTopic')}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab('recent')}
          className={`pb-2 px-1 border-b-2 font-medium ${
            activeTab === 'recent' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('community.forums.recentTopics')}
        </button>
        <button
          onClick={() => setActiveTab('popular')}
          className={`pb-2 px-1 border-b-2 font-medium ${
            activeTab === 'popular' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('community.forums.popularTopics')}
        </button>
      </div>

      {/* Create Topic Form */}
      {activeTab === 'create' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('community.forums.createTopic')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <Input
                value={newTopic.title}
                onChange={(e) => setNewTopic(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter topic title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Content</label>
              <Textarea
                value={newTopic.content}
                onChange={(e) => setNewTopic(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Describe your topic..."
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tags (comma separated)</label>
              <Input
                value={newTopic.tags}
                onChange={(e) => setNewTopic(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="water, infrastructure, urgent"
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleCreateTopic}>
                Create Topic
              </Button>
              <Button variant="outline" onClick={() => setActiveTab('recent')}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Topics List */}
      {activeTab !== 'create' && (
        <div className="space-y-4">
          {filteredTopics.map((topic) => (
            <Card key={topic.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold cursor-pointer hover:text-primary" 
                          onClick={() => handleReply(topic.id)}>
                        {topic.title}
                      </h3>
                      {topic.isPopular && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Popular
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-3 line-clamp-2">{topic.content}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{topic.author}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(topic.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="w-4 h-4" />
                        <span>{topic.replies} replies</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 mb-3">
                      {topic.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleLike(topic.id)}
                        className="flex items-center space-x-1 text-gray-500 hover:text-green-600"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span>{topic.likes}</span>
                      </button>
                      <button
                        onClick={() => handleDislike(topic.id)}
                        className="flex items-center space-x-1 text-gray-500 hover:text-red-600"
                      >
                        <ThumbsDown className="w-4 h-4" />
                        <span>{topic.dislikes}</span>
                      </button>
                      <button
                        onClick={() => handleReply(topic.id)}
                        className="flex items-center space-x-1 text-gray-500 hover:text-primary"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Reply</span>
                      </button>
                      <button className="flex items-center space-x-1 text-gray-500 hover:text-primary">
                        <Share2 className="w-4 h-4" />
                        <span>Share</span>
                      </button>
                      <button className="flex items-center space-x-1 text-gray-500 hover:text-red-600">
                        <Flag className="w-4 h-4" />
                        <span>Report</span>
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Topic Detail Modal */}
      {selectedTopic && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selectedTopic.title}</CardTitle>
                <Button variant="ghost" onClick={() => setSelectedTopic(null)}>
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-b pb-4">
                <p className="text-gray-700 mb-4">{selectedTopic.content}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>By {selectedTopic.author}</span>
                  <span>{new Date(selectedTopic.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Replies ({replies.length})</h4>
                {replies.map((reply) => (
                  <div key={reply.id} className="border-l-4 border-gray-200 pl-4">
                    <p className="text-gray-700 mb-2">{reply.content}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>By {reply.author}</span>
                      <span>{new Date(reply.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <Textarea
                  placeholder="Write your reply..."
                  rows={3}
                  className="mb-4"
                />
                <Button>Post Reply</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
