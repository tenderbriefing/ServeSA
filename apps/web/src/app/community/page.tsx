'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { CommunityForums } from '@/components/CommunityForums'
import { VotingSystem } from '@/components/VotingSystem'
import { 
  MessageSquare, 
  ThumbsUp, 
  Lightbulb, 
  Users, 
  TrendingUp,
  Globe,
  Heart,
  Star
} from 'lucide-react'

export default function CommunityPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('forums')

  // Mock community stats
  const communityStats = {
    totalMembers: 15420,
    activeDiscussions: 89,
    totalVotes: 2347,
    implementedSolutions: 23,
    communityImpact: 156000 // people impacted
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('community.title')}</h1>
          <p className="text-xl text-gray-600">
            Connect with your neighbors, discuss local issues, and help improve your community
          </p>
        </div>

        {/* Community Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{communityStats.totalMembers.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Community Members</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{communityStats.activeDiscussions}</div>
                  <div className="text-sm text-gray-500">Active Discussions</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <ThumbsUp className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{communityStats.totalVotes.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Total Votes</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Lightbulb className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{communityStats.implementedSolutions}</div>
                  <div className="text-sm text-gray-500">Solutions Implemented</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Heart className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{communityStats.communityImpact.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">People Impacted</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="forums" className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>Forums</span>
            </TabsTrigger>
            <TabsTrigger value="voting" className="flex items-center space-x-2">
              <ThumbsUp className="h-4 w-4" />
              <span>Voting</span>
            </TabsTrigger>
            <TabsTrigger value="solutions" className="flex items-center space-x-2">
              <Lightbulb className="h-4 w-4" />
              <span>Solutions</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="forums" className="space-y-6">
            <CommunityForums />
          </TabsContent>

          <TabsContent value="voting" className="space-y-6">
            <VotingSystem />
          </TabsContent>

          <TabsContent value="solutions" className="space-y-6">
            <CrowdsourcedSolutions />
          </TabsContent>
        </Tabs>

        {/* Community Guidelines */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span>Community Guidelines</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Be Respectful</h4>
                <p className="text-gray-600 text-sm">
                  Treat all community members with respect and kindness. We're all working together to improve our neighborhoods.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Stay On Topic</h4>
                <p className="text-gray-600 text-sm">
                  Keep discussions focused on local issues and community improvement. Avoid off-topic conversations.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Provide Constructive Feedback</h4>
                <p className="text-gray-600 text-sm">
                  When voting or commenting, provide constructive feedback that helps move discussions forward.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Report Issues</h4>
                <p className="text-gray-600 text-sm">
                  If you see inappropriate content or behavior, please report it to help maintain a positive community.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Crowdsourced Solutions Component
function CrowdsourcedSolutions() {
  const { t } = useTranslation()
  const [selectedStatus, setSelectedStatus] = useState('all')

  // Mock solutions data
  const solutions = [
    {
      id: '1',
      title: 'Community Garden Initiative',
      description: 'Transform vacant lots into community gardens to improve food security and community bonding.',
      author: 'Sarah Mkhize',
      votes: 234,
      status: 'implemented',
      impact: '500+ people',
      category: 'Community Development',
      createdAt: '2024-01-10T09:00:00Z'
    },
    {
      id: '2',
      title: 'Solar Street Lighting',
      description: 'Install solar-powered street lights to improve safety and reduce electricity costs.',
      author: 'David van der Merwe',
      votes: 189,
      status: 'under_review',
      impact: '2000+ people',
      category: 'Infrastructure',
      createdAt: '2024-01-12T14:30:00Z'
    },
    {
      id: '3',
      title: 'Youth Skills Training Program',
      description: 'Establish a community center for youth skills training and job preparation.',
      author: 'Nomsa Dlamini',
      votes: 156,
      status: 'proposed',
      impact: '300+ youth',
      category: 'Education',
      createdAt: '2024-01-14T11:20:00Z'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'implemented': return 'bg-green-100 text-green-800'
      case 'under_review': return 'bg-yellow-100 text-yellow-800'
      case 'proposed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'implemented': return 'Implemented'
      case 'under_review': return 'Under Review'
      case 'proposed': return 'Proposed'
      default: return 'Unknown'
    }
  }

  const filteredSolutions = solutions.filter(solution => 
    selectedStatus === 'all' || solution.status === selectedStatus
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('community.solutions.title')}</h2>
          <p className="text-gray-600">{t('community.solutions.description')}</p>
        </div>
        <Button>
          {t('community.solutions.suggestSolution')}
        </Button>
      </div>

      {/* Filter */}
      <div className="flex space-x-2">
        <Button
          variant={selectedStatus === 'all' ? 'default' : 'outline'}
          onClick={() => setSelectedStatus('all')}
        >
          All Solutions
        </Button>
        <Button
          variant={selectedStatus === 'proposed' ? 'default' : 'outline'}
          onClick={() => setSelectedStatus('proposed')}
        >
          Proposed
        </Button>
        <Button
          variant={selectedStatus === 'under_review' ? 'default' : 'outline'}
          onClick={() => setSelectedStatus('under_review')}
        >
          Under Review
        </Button>
        <Button
          variant={selectedStatus === 'implemented' ? 'default' : 'outline'}
          onClick={() => setSelectedStatus('implemented')}
        >
          Implemented
        </Button>
      </div>

      {/* Solutions List */}
      <div className="space-y-4">
        {filteredSolutions.map((solution) => (
          <Card key={solution.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{solution.title}</h3>
                  <p className="text-gray-600 mb-3">{solution.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>By {solution.author}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ThumbsUp className="w-4 h-4" />
                      <span>{solution.votes} votes</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Heart className="w-4 h-4" />
                      <span>Impact: {solution.impact}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{solution.category}</Badge>
                    <Badge className={getStatusColor(solution.status)}>
                      {getStatusText(solution.status)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Proposed {new Date(solution.createdAt).toLocaleDateString()}</span>
                <Button variant="outline" size="sm">
                  Vote
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Solutions Message */}
      {filteredSolutions.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-500">
              <Lightbulb className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No solutions found</h3>
              <p>Try adjusting your filters or be the first to suggest a solution!</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
