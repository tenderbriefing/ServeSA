'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  MapPin, 
  Filter,
  Search,
  BarChart3,
  TrendingUp,
  Calendar,
  Eye,
  Map,
  CheckCircle,
  Plus
} from 'lucide-react'

export default function ExplorePage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedWard, setSelectedWard] = useState('all')
  const [viewMode, setViewMode] = useState('list') // 'list' or 'map'

  // Mock data - in real app this would come from API
  const cases = [
    {
      id: 'CASE-2024-001',
      title: 'Water Leak on Main Street',
      description: 'Major water leak affecting traffic and nearby businesses',
      category: 'Water & Sewage',
      status: 'IN_PROGRESS',
      priority: 'high',
      location: 'Johannesburg, Ward 58',
      ward: 'Ward 58',
      municipality: 'Johannesburg',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-16T14:20:00Z',
      coordinates: { lat: -26.2041, lng: 28.0473 }
    },
    {
      id: 'CASE-2024-002',
      title: 'Pothole on Oak Avenue',
      description: 'Large pothole causing damage to vehicles',
      category: 'Roads & Infrastructure',
      status: 'ACK',
      priority: 'medium',
      location: 'Johannesburg, Ward 58',
      ward: 'Ward 58',
      municipality: 'Johannesburg',
      createdAt: '2024-01-14T16:45:00Z',
      updatedAt: '2024-01-15T09:15:00Z',
      coordinates: { lat: -26.2050, lng: 28.0480 }
    },
    {
      id: 'CASE-2024-003',
      title: 'Street Light Out',
      description: 'Street light not working for past 3 days',
      category: 'Electricity',
      status: 'RESOLVED',
      priority: 'low',
      location: 'Johannesburg, Ward 58',
      ward: 'Ward 58',
      municipality: 'Johannesburg',
      createdAt: '2024-01-10T19:20:00Z',
      updatedAt: '2024-01-12T11:30:00Z',
      coordinates: { lat: -26.2030, lng: 28.0460 }
    }
  ]

  const categories = [
    { id: 'all', name: 'All Categories', count: cases.length },
    { id: 'water-sewage', name: 'Water & Sewage', count: cases.filter(c => c.category === 'Water & Sewage').length },
    { id: 'roads-infrastructure', name: 'Roads & Infrastructure', count: cases.filter(c => c.category === 'Roads & Infrastructure').length },
    { id: 'electricity', name: 'Electricity', count: cases.filter(c => c.category === 'Electricity').length },
    { id: 'waste-management', name: 'Waste Management', count: 0 },
    { id: 'digital-services', name: 'Digital Services', count: 0 },
    { id: 'emergency-services', name: 'Emergency Services', count: 0 }
  ]

  const wards = [
    { id: 'all', name: 'All Wards', count: cases.length },
    { id: 'ward-58', name: 'Ward 58', count: cases.filter(c => c.ward === 'Ward 58').length },
    { id: 'ward-59', name: 'Ward 59', count: 0 },
    { id: 'ward-60', name: 'Ward 60', count: 0 }
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

  const filteredCases = cases.filter(case_ => {
    const matchesCategory = selectedCategory === 'all' || 
      case_.category.toLowerCase().replace(/\s+/g, '-') === selectedCategory
    const matchesWard = selectedWard === 'all' || 
      case_.ward.toLowerCase().replace(/\s+/g, '-') === selectedWard
    return matchesCategory && matchesWard
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore Cases</h1>
          <p className="text-gray-600">Discover and track service delivery issues in your area</p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cases.length}</div>
              <p className="text-xs text-muted-foreground">
                Across all wards
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cases.filter(c => c.status !== 'RESOLVED').length}</div>
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
              <div className="text-2xl font-bold">{cases.filter(c => c.status === 'RESOLVED').length}</div>
              <p className="text-xs text-muted-foreground">
                Successfully completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wards Covered</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{new Set(cases.map(c => c.ward)).size}</div>
              <p className="text-xs text-muted-foreground">
                Active wards
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and View Toggle */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Category Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Ward Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Ward</label>
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {wards.map((ward) => (
                  <option key={ward.id} value={ward.id}>
                    {ward.name} ({ward.count})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-end">
            <div className="flex bg-white rounded-lg p-1 border">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                List View
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'map'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Map className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Cases Display */}
        {viewMode === 'list' ? (
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
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <CardContent>
              <Map className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Map View</h3>
              <p className="text-gray-600 mb-4">
                Interactive map showing case locations will be implemented here
              </p>
              <Button onClick={() => setViewMode('list')}>
                Switch to List View
              </Button>
            </CardContent>
          </Card>
        )}

        {filteredCases.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No cases found</h3>
                <p className="mb-4">Try adjusting your filters or check back later</p>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Report an Issue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
