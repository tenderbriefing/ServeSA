'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { 
  ThumbsUp, 
  ThumbsDown, 
  TrendingUp, 
  AlertTriangle,
  Clock,
  MapPin,
  Users,
  Star
} from 'lucide-react'

interface VotableIssue {
  id: string
  title: string
  description: string
  category: string
  location: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  votes: number
  upvotes: number
  downvotes: number
  createdAt: string
  status: 'pending' | 'acknowledged' | 'in_progress' | 'resolved'
  impact: number // Number of people affected
  urgency: number // 1-10 scale
  upvoters?: string[]
  downvoters?: string[]
}

export function VotingSystem() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState<'votes' | 'urgency' | 'impact' | 'date'>('votes')
  const [userVotes, setUserVotes] = useState<Record<string, 'up' | 'down' | null>>({})
  const [issues, setIssues] = useState<VotableIssue[]>([])
  const [loading, setLoading] = useState(true)

  // Load votable issues from Firestore
  useEffect(() => {
    const loadIssues = async () => {
      setLoading(true)
      try {
        const issuesQuery = query(
          collection(db, 'votableIssues'),
          orderBy('createdAt', 'desc')
        )
        
        const unsubscribe = onSnapshot(issuesQuery, (snapshot) => {
          const issuesData: VotableIssue[] = []
          
          snapshot.docs.forEach((docSnapshot) => {
            const data = docSnapshot.data()
            issuesData.push({
              id: docSnapshot.id,
              title: data.title,
              description: data.description,
              category: data.category,
              location: data.location,
              priority: data.priority,
              votes: data.votes || 0,
              upvotes: data.upvotes || 0,
              downvotes: data.downvotes || 0,
              createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
              status: data.status,
              impact: data.impact || 0,
              urgency: data.urgency || 0,
              upvoters: data.upvoters || [],
              downvoters: data.downvoters || []
            })
          })
          
          setIssues(issuesData)
          
          // Update user votes based on current data
          if (user) {
            const votes: Record<string, 'up' | 'down' | null> = {}
            issuesData.forEach(issue => {
              if (issue.upvoters?.includes(user.uid)) {
                votes[issue.id] = 'up'
              } else if (issue.downvoters?.includes(user.uid)) {
                votes[issue.id] = 'down'
              } else {
                votes[issue.id] = null
              }
            })
            setUserVotes(votes)
          }
        })

        return () => unsubscribe()
      } catch (error) {
        console.error('Error loading votable issues:', error)
        // Fallback to default issues if Firestore fails
        const defaultIssues: VotableIssue[] = [
          {
            id: '1',
            title: 'Major water leak on Main Street',
            description: 'Large water leak affecting traffic and nearby businesses. Water flowing onto the road.',
            category: 'Water & Sewage',
            location: 'Ward 58, Johannesburg',
            priority: 'high',
            votes: 156,
            upvotes: 142,
            downvotes: 14,
            createdAt: '2024-01-15T10:30:00Z',
            status: 'acknowledged',
            impact: 500,
            urgency: 8
          },
          {
            id: '2',
            title: 'Pothole causing vehicle damage',
            description: 'Large pothole on Oak Avenue causing damage to vehicles. Multiple complaints received.',
            category: 'Roads & Infrastructure',
            location: 'Ward 59, Johannesburg',
            priority: 'medium',
            votes: 89,
            upvotes: 78,
            downvotes: 11,
            createdAt: '2024-01-14T16:45:00Z',
            status: 'pending',
            impact: 200,
            urgency: 6
          }
        ]
        setIssues(defaultIssues)
      } finally {
        setLoading(false)
      }
    }

    loadIssues()
  }, [user])

  const handleVote = async (issueId: string, voteType: 'up' | 'down') => {
    if (!user) return

    const issue = issues.find(i => i.id === issueId)
    if (!issue) return

    const currentVote = userVotes[issueId]
    const issueRef = doc(db, 'votableIssues', issueId)

    try {
      if (currentVote === voteType) {
        // Remove vote
        await updateDoc(issueRef, {
          [`${voteType}voters`]: arrayRemove(user.uid),
          [`${voteType}votes`]: Math.max(0, issue[`${voteType}votes`] - 1),
          votes: Math.max(0, issue.votes - 1),
          updatedAt: serverTimestamp()
        })
        setUserVotes(prev => ({ ...prev, [issueId]: null }))
      } else {
        // Add new vote or change vote
        const updates: any = {
          [`${voteType}voters`]: arrayUnion(user.uid),
          [`${voteType}votes`]: issue[`${voteType}votes`] + 1,
          votes: issue.votes + 1,
          updatedAt: serverTimestamp()
        }

        // If changing from opposite vote, remove from other array
        if (currentVote && currentVote !== voteType) {
          updates[`${currentVote}voters`] = arrayRemove(user.uid)
          updates[`${currentVote}votes`] = Math.max(0, issue[`${currentVote}votes`] - 1)
          updates.votes = issue.votes // No net change in total votes
        }

        await updateDoc(issueRef, updates)
        setUserVotes(prev => ({ ...prev, [issueId]: voteType }))
      }
    } catch (error) {
      console.error('Error voting:', error)
    }
  }

  const filteredIssues = issues.filter(issue => {
    const matchesCategory = selectedCategory === 'all' || issue.category === selectedCategory
    return matchesCategory
  })

  const sortedIssues = [...filteredIssues].sort((a, b) => {
    switch (sortBy) {
      case 'votes':
        return b.votes - a.votes
      case 'urgency':
        return b.urgency - a.urgency
      case 'impact':
        return b.impact - a.impact
      case 'date':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      default:
        return 0
    }
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'acknowledged': return 'bg-yellow-100 text-yellow-800'
      case 'pending': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const categories = [
    { value: 'all', label: t('voting.allCategories') },
    { value: 'Water & Sewage', label: t('voting.waterSewage') },
    { value: 'Roads & Infrastructure', label: t('voting.roadsInfrastructure') },
    { value: 'Electricity', label: t('voting.electricity') },
    { value: 'Waste Management', label: t('voting.wasteManagement') },
    { value: 'Emergency Services', label: t('voting.emergencyServices') }
  ]

  const sortOptions = [
    { value: 'votes', label: t('voting.mostVoted') },
    { value: 'urgency', label: t('voting.mostUrgent') },
    { value: 'impact', label: t('voting.highestImpact') },
    { value: 'date', label: t('voting.newest') }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t('voting.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('voting.title')}</h2>
          <p className="text-muted-foreground">{t('voting.description')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex gap-2">
          {categories.map(category => (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.value)}
            >
              {category.label}
            </Button>
          ))}
        </div>
        
        <div className="flex gap-2 ml-auto">
          {sortOptions.map(option => (
            <Button
              key={option.value}
              variant={sortBy === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy(option.value as any)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        {sortedIssues.map((issue) => {
          const approvalRate = issue.votes > 0 ? (issue.upvotes / issue.votes) * 100 : 0
          const currentVote = userVotes[issue.id]

          return (
            <Card key={issue.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{issue.title}</CardTitle>
                    <CardDescription className="mt-2">{issue.description}</CardDescription>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Badge className={getPriorityColor(issue.priority)}>
                      {issue.priority}
                    </Badge>
                    <Badge className={getStatusColor(issue.status)}>
                      {issue.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Issue Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{issue.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{issue.impact} {t('voting.peopleAffected')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    <span>{t('voting.urgency')}: {issue.urgency}/10</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Voting Section */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant={currentVote === 'up' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleVote(issue.id, 'up')}
                        disabled={!user}
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        {issue.upvotes}
                      </Button>
                      <Button
                        variant={currentVote === 'down' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleVote(issue.id, 'down')}
                        disabled={!user}
                      >
                        <ThumbsDown className="h-4 w-4 mr-1" />
                        {issue.downvotes}
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {t('voting.totalVotes')}: {issue.votes}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-24">
                      <Progress value={approvalRate} className="h-2" />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {approvalRate.toFixed(0)}% {t('voting.approval')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {sortedIssues.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{t('voting.noIssuesFound')}</p>
        </div>
      )}
    </div>
  )
}