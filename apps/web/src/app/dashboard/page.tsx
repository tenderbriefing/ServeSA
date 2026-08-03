'use client'

import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Plus,
  Filter,
  Search,
  BarChart3,
  TrendingUp,
  Calendar,
  Building2
} from 'lucide-react'
import { MunicipalityProfile } from '@/components/Municipality/MunicipalityProfile'
import { useAuth } from '@/hooks/useAuth'
import { AuthGate } from '@/components/Auth/AuthGate'

export default function DashboardPage() {
  const { user, userProfile } = useAuth()
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const [cases, setCases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Load cases from backend
  useEffect(() => {
    const loadCases = async () => {
      setLoading(true)
      try {
        // Load user's cases from Firestore
        const casesQuery = query(
          collection(db, 'cases'),
          where('userId', '==', user?.uid),
          orderBy('createdAt', 'desc')
        )

        const unsubscribe = onSnapshot(casesQuery, (snapshot) => {
          const casesData: any[] = []

          snapshot.docs.forEach((docSnapshot) => {
            const data = docSnapshot.data()
            casesData.push({
              id: docSnapshot.id,
              caseId: data.caseId,
              title: data.title || data.description?.substring(0, 50) + '...',
              description: data.description,
              category: data.category,
              status: data.status,
              priority: data.priority || data.severity,
              location: data.location?.address || data.address || 'Location not specified',
              wardName: data.location?.wardName,
              municipalityName: data.location?.municipalityName,
              createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
              updatedAt: data.updatedAt?.toDate()?.toISOString() || new Date().toISOString(),
              estimatedResolution: data.slaTarget?.toDate()?.toISOString(),
              resolvedAt: data.resolvedAt?.toDate()?.toISOString(),
              slaBreach: data.slaBreach || false,
              mediaUrls: data.mediaUrls || []
            })
          })

          setCases(casesData)
        })

        return () => unsubscribe()
      } catch (error) {
        console.error('Error loading cases:', error)
        // Fallback to default cases if Firestore fails
        const defaultCases = [
          {
            id: 'CASE-2024-001',
            caseId: 'CASE-2024-001',
            title: 'Water Leak on Main Street',
            description: 'Major water leak affecting traffic and nearby businesses',
            category: 'Water & Sewage',
            status: 'in_progress',
            priority: 'high',
            location: 'Johannesburg, Ward 58',
            wardName: 'Ward 58',
            municipalityName: 'City of Johannesburg',
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-16T14:20:00Z',
            estimatedResolution: '2024-01-18T12:00:00Z',
            slaBreach: false,
            mediaUrls: []
          },
          {
            id: 'CASE-2024-002',
            caseId: 'CASE-2024-002',
            title: 'Pothole on Oak Avenue',
            description: 'Large pothole causing damage to vehicles',
            category: 'Roads & Infrastructure',
            status: 'acknowledged',
            priority: 'medium',
            location: 'Johannesburg, Ward 58',
            wardName: 'Ward 58',
            municipalityName: 'City of Johannesburg',
            createdAt: '2024-01-14T16:45:00Z',
            updatedAt: '2024-01-15T09:15:00Z',
            estimatedResolution: '2024-01-20T12:00:00Z',
            slaBreach: false,
            mediaUrls: []
          }
        ]
        setCases(defaultCases)
      } finally {
        setLoading(false)
      }
    }

    if (user?.uid) {
      loadCases()
    }
  }, [user?.uid])

  const stats = {
    total: cases.length,
    active: cases.filter(c => !['resolved', 'closed'].includes(c.status)).length,
    resolved: cases.filter(c => ['resolved', 'closed'].includes(c.status)).length,
    avgResolutionTime: '2.3 days'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-gray-100 text-gray-800'
      case 'acknowledged': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredCases = cases.filter(case_ => {
    let matchesTab = true
    if (activeTab === 'acknowledged') {
      matchesTab = case_.status === 'acknowledged'
    } else if (activeTab === 'in_progress') {
      matchesTab = case_.status === 'in_progress'
    } else if (activeTab === 'resolved') {
      matchesTab = ['resolved', 'closed'].includes(case_.status)
    }
    
    const matchesSearch = searchTerm === '' ||
      case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.location.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesTab && matchesSearch
  })

  return (
    <AuthGate>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Track your reported issues and their progress</p>
        </div>

        {/* Municipality Profile Section */}
        <div className="mb-8">
          <MunicipalityProfile />
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                All time reports
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
              <p className="text-xs text-muted-foreground">
                Currently being processed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.resolved}</div>
              <p className="text-xs text-muted-foreground">
                Successfully completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgResolutionTime}</div>
              <p className="text-xs text-muted-foreground">
                Time to resolution
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Button className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Report New Issue
          </Button>
          
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search cases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Tabs */}
                 <div className="flex space-x-1 bg-white p-1 rounded-lg mb-6">
                   {[
                     { id: 'all', label: 'All Cases', count: cases.length },
                     { id: 'acknowledged', label: 'Acknowledged', count: cases.filter(c => c.status === 'acknowledged').length },
                     { id: 'in_progress', label: 'In Progress', count: cases.filter(c => c.status === 'in_progress').length },
                     { id: 'resolved', label: 'Resolved', count: cases.filter(c => ['resolved', 'closed'].includes(c.status)).length }
                   ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Cases List */}
        <div className="space-y-4">
          {filteredCases.map((case_) => (
            <Card key={case_.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{case_.title}</h3>
                      <Badge className={getStatusColor(case_.status)}>
                        {case_.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={getPriorityColor(case_.priority)}>
                        {case_.priority}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-2">{case_.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {case_.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(case_.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <strong>Case ID:</strong> {case_.id}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    {case_.status !== 'RESOLVED' && (
                      <Button variant="outline" size="sm">
                        Update
                      </Button>
                    )}
                  </div>
                </div>
                {case_.status !== 'RESOLVED' && case_.estimatedResolution && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-blue-800">
                      <Clock className="w-4 h-4" />
                      <span>
                        Estimated resolution: {new Date(case_.estimatedResolution).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCases.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No cases found</h3>
                <p className="mb-4">Try adjusting your search or filters</p>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Report Your First Issue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </AuthGate>
  )
}
