'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  BarChart3,
  TrendingUp,
  Users,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Filter,
  Download,
  Eye
} from 'lucide-react'

export default function AdminPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('7d')
  const [selectedWard, setSelectedWard] = useState('all')

  // Mock data - in real app this would come from API
  const stats = {
    totalCases: 4237,
    activeCases: 892,
    resolvedCases: 3345,
    avgResolutionTime: '2.3 days',
    responseRate: '94%',
    satisfactionRate: '87%'
  }

  const recentCases = [
    {
      id: 'CASE-2024-001',
      title: 'Water Leak on Main Street',
      category: 'Water & Sewage',
      status: 'IN_PROGRESS',
      priority: 'high',
      ward: 'Ward 58',
      createdAt: '2024-01-15T10:30:00Z',
      assignedTo: 'John Smith'
    },
    {
      id: 'CASE-2024-002',
      title: 'Pothole on Oak Avenue',
      category: 'Roads & Infrastructure',
      status: 'ACK',
      priority: 'medium',
      ward: 'Ward 58',
      createdAt: '2024-01-14T16:45:00Z',
      assignedTo: 'Sarah Johnson'
    },
    {
      id: 'CASE-2024-003',
      title: 'Street Light Out',
      category: 'Electricity',
      status: 'RESOLVED',
      priority: 'low',
      ward: 'Ward 58',
      createdAt: '2024-01-10T19:20:00Z',
      assignedTo: 'Mike Wilson'
    }
  ]

  const categoryStats = [
    { name: 'Water & Sewage', count: 1247, percentage: 29.4 },
    { name: 'Roads & Infrastructure', count: 2156, percentage: 50.9 },
    { name: 'Electricity', count: 892, percentage: 21.1 },
    { name: 'Waste Management', count: 634, percentage: 15.0 },
    { name: 'Digital Services', count: 156, percentage: 3.7 }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACK': return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800'
      case 'RESOLVED': return 'bg-green-100 text-green-800'
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Monitor and manage service delivery cases</p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCases.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                All time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeCases.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Currently processing
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.resolvedCases.toLocaleString()}</div>
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
                Time to completion
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.responseRate}</div>
              <p className="text-xs text-muted-foreground">
                Within SLA
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.satisfactionRate}</div>
              <p className="text-xs text-muted-foreground">
                User satisfaction
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Ward</label>
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Wards</option>
              <option value="ward-58">Ward 58</option>
              <option value="ward-59">Ward 59</option>
              <option value="ward-60">Ward 60</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Cases by Category</CardTitle>
              <CardDescription>Distribution of reported issues by service category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryStats.map((category) => (
                  <div key={category.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-primary-600 rounded-full"></div>
                      <span className="text-sm font-medium">{category.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{category.count}</span>
                      <span className="text-xs text-gray-500">({category.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest case updates and assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentCases.map((case_) => (
                  <div key={case_.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{case_.title}</span>
                        <Badge className={getStatusColor(case_.status)}>
                          {case_.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={getPriorityColor(case_.priority)}>
                          {case_.priority}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">
                        {case_.category} • {case_.ward} • {new Date(case_.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Key performance indicators and trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">89%</div>
                <div className="text-sm text-gray-600">Resolution Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">24h</div>
                <div className="text-sm text-gray-600">Avg Response Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">156</div>
                <div className="text-sm text-gray-600">Active Wards</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">4.2/5</div>
                <div className="text-sm text-gray-600">User Rating</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Button className="h-20 flex-col">
                <BarChart3 className="w-6 h-6 mb-2" />
                <span>View Analytics</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Users className="w-6 h-6 mb-2" />
                <span>Manage Users</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <MapPin className="w-6 h-6 mb-2" />
                <span>Ward Management</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
