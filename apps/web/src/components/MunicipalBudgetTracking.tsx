'use client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  BarChart3, 
  Calendar,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Target
} from 'lucide-react'

interface BudgetCategory {
  id: string
  name: string
  allocated: number
  spent: number
  remaining: number
  issues: number
  priority: 'low' | 'medium' | 'high'
  trend: 'up' | 'down' | 'stable'
}

interface BudgetItem {
  id: string
  title: string
  category: string
  allocated: number
  spent: number
  description: string
  status: 'planned' | 'in-progress' | 'completed' | 'overdue'
  startDate: string
  endDate: string
  location: string
  impact: number
}

interface IssueBudgetImpact {
  issueId: string
  title: string
  category: string
  estimatedCost: number
  actualCost?: number
  budgetCategory: string
  impact: 'low' | 'medium' | 'high'
  status: 'pending' | 'approved' | 'in-progress' | 'completed'
}

const budgetCategories: BudgetCategory[] = [
  {
    id: 'infrastructure',
    name: 'Infrastructure',
    allocated: 5000000,
    spent: 3200000,
    remaining: 1800000,
    issues: 45,
    priority: 'high',
    trend: 'up'
  },
  {
    id: 'water-sanitation',
    name: 'Water & Sanitation',
    allocated: 3000000,
    spent: 2100000,
    remaining: 900000,
    issues: 32,
    priority: 'high',
    trend: 'up'
  },
  {
    id: 'roads-transport',
    name: 'Roads & Transport',
    allocated: 4000000,
    spent: 2800000,
    remaining: 1200000,
    issues: 28,
    priority: 'medium',
    trend: 'stable'
  },
  {
    id: 'public-safety',
    name: 'Public Safety',
    allocated: 2000000,
    spent: 1500000,
    remaining: 500000,
    issues: 15,
    priority: 'medium',
    trend: 'down'
  },
  {
    id: 'environment',
    name: 'Environment',
    allocated: 1500000,
    spent: 800000,
    remaining: 700000,
    issues: 12,
    priority: 'low',
    trend: 'stable'
  }
]

const budgetItems: BudgetItem[] = [
  {
    id: 'road-repairs-2024',
    title: 'Road Repairs 2024',
    category: 'roads-transport',
    allocated: 800000,
    spent: 520000,
    description: 'Comprehensive road repair and maintenance program',
    status: 'in-progress',
    startDate: '2024-01-15',
    endDate: '2024-12-31',
    location: 'City Center',
    impact: 85
  },
  {
    id: 'water-pipe-replacement',
    title: 'Water Pipe Replacement',
    category: 'water-sanitation',
    allocated: 600000,
    spent: 450000,
    description: 'Replacement of aging water infrastructure',
    status: 'in-progress',
    startDate: '2024-03-01',
    endDate: '2024-11-30',
    location: 'North District',
    impact: 92
  },
  {
    id: 'streetlight-upgrade',
    title: 'Streetlight LED Upgrade',
    category: 'infrastructure',
    allocated: 400000,
    spent: 280000,
    description: 'Upgrade to energy-efficient LED streetlights',
    status: 'completed',
    startDate: '2024-02-01',
    endDate: '2024-08-31',
    location: 'Citywide',
    impact: 78
  }
]

const issueImpacts: IssueBudgetImpact[] = [
  {
    issueId: 'ISSUE-001',
    title: 'Pothole on Main Street',
    category: 'roads',
    estimatedCost: 5000,
    actualCost: 4800,
    budgetCategory: 'roads-transport',
    impact: 'medium',
    status: 'completed'
  },
  {
    issueId: 'ISSUE-002',
    title: 'Water Leak in Park',
    category: 'water',
    estimatedCost: 15000,
    budgetCategory: 'water-sanitation',
    impact: 'high',
    status: 'approved'
  },
  {
    issueId: 'ISSUE-003',
    title: 'Broken Streetlight',
    category: 'streetlights',
    estimatedCost: 800,
    actualCost: 750,
    budgetCategory: 'infrastructure',
    impact: 'low',
    status: 'completed'
  }
]

export function MunicipalBudgetTracking() {
  const { t } = useTranslation()
  const [selectedYear, setSelectedYear] = useState('2024')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [activeTab, setActiveTab] = useState('overview')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in-progress': return 'bg-blue-100 text-blue-800'
      case 'planned': return 'bg-yellow-100 text-yellow-800'
      case 'overdue': return 'bg-red-100 text-red-800'
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

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-red-500" />
      case 'down': return <TrendingDown className="h-4 w-4 text-green-500" />
      case 'stable': return <BarChart3 className="h-4 w-4 text-blue-500" />
      default: return <BarChart3 className="h-4 w-4 text-gray-500" />
    }
  }

  const totalAllocated = budgetCategories.reduce((acc, cat) => acc + cat.allocated, 0)
  const totalSpent = budgetCategories.reduce((acc, cat) => acc + cat.spent, 0)
  const totalRemaining = totalAllocated - totalSpent
  const spendingPercentage = (totalSpent / totalAllocated) * 100

  const filteredCategories = selectedCategory === 'all' 
    ? budgetCategories 
    : budgetCategories.filter(cat => cat.id === selectedCategory)

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <DollarSign className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">{t('budgetTracking.title')}</h1>
        </div>
        <p className="text-gray-600">{t('budgetTracking.description')}</p>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2024">2024</SelectItem>
            <SelectItem value="2023">2023</SelectItem>
            <SelectItem value="2022">2022</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t('budgetTracking.selectCategory')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('budgetTracking.allCategories')}</SelectItem>
            {budgetCategories.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-gray-600">{t('budgetTracking.totalAllocated')}</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalAllocated)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">{t('budgetTracking.totalSpent')}</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium text-gray-600">{t('budgetTracking.remaining')}</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalRemaining)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">{t('budgetTracking.spendingRate')}</span>
            </div>
            <p className="text-2xl font-bold">{Math.round(spendingPercentage)}%</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">{t('budgetTracking.overview')}</TabsTrigger>
          <TabsTrigger value="projects">{t('budgetTracking.projects')}</TabsTrigger>
          <TabsTrigger value="impacts">{t('budgetTracking.impacts')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Budget Categories */}
          <Card>
            <CardHeader>
              <CardTitle>{t('budgetTracking.budgetCategories')}</CardTitle>
              <CardDescription>{t('budgetTracking.categoriesDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredCategories.map((category) => {
                  const spentPercentage = (category.spent / category.allocated) * 100
                  return (
                    <div key={category.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold">{category.name}</h3>
                          <Badge className={getPriorityColor(category.priority)}>
                            {category.priority}
                          </Badge>
                          {getTrendIcon(category.trend)}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">{category.issues} {t('budgetTracking.issues')}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">{t('budgetTracking.allocated')}</p>
                          <p className="font-semibold">{formatCurrency(category.allocated)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">{t('budgetTracking.spent')}</p>
                          <p className="font-semibold">{formatCurrency(category.spent)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">{t('budgetTracking.remaining')}</p>
                          <p className="font-semibold">{formatCurrency(category.remaining)}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>{t('budgetTracking.spendingProgress')}</span>
                          <span>{Math.round(spentPercentage)}%</span>
                        </div>
                        <Progress value={spentPercentage} className="w-full" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('budgetTracking.activeProjects')}</CardTitle>
              <CardDescription>{t('budgetTracking.projectsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {budgetItems.map((item) => {
                  const spentPercentage = (item.spent / item.allocated) * 100
                  return (
                    <div key={item.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4" />
                              <span>{item.location}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Users className="h-4 w-4" />
                              <span>{item.impact}% {t('budgetTracking.impact')}</span>
                            </span>
                          </div>
                        </div>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">{t('budgetTracking.allocated')}</p>
                          <p className="font-semibold">{formatCurrency(item.allocated)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">{t('budgetTracking.spent')}</p>
                          <p className="font-semibold">{formatCurrency(item.spent)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">{t('budgetTracking.startDate')}</p>
                          <p className="font-semibold">{new Date(item.startDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">{t('budgetTracking.endDate')}</p>
                          <p className="font-semibold">{new Date(item.endDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>{t('budgetTracking.completionProgress')}</span>
                          <span>{Math.round(spentPercentage)}%</span>
                        </div>
                        <Progress value={spentPercentage} className="w-full" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="impacts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('budgetTracking.issueImpacts')}</CardTitle>
              <CardDescription>{t('budgetTracking.impactsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {issueImpacts.map((impact) => (
                  <div key={impact.issueId} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{impact.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{t(`categories.${impact.category}`)}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>{t('budgetTracking.issueId')}: {impact.issueId}</span>
                          <span>{t('budgetTracking.budgetCategory')}: {budgetCategories.find(cat => cat.id === impact.budgetCategory)?.name}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getPriorityColor(impact.impact)}>
                          {impact.impact} {t('budgetTracking.impact')}
                        </Badge>
                        <Badge className={`ml-2 ${getStatusColor(impact.status)}`}>
                          {impact.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">{t('budgetTracking.estimatedCost')}</p>
                        <p className="font-semibold">{formatCurrency(impact.estimatedCost)}</p>
                      </div>
                      {impact.actualCost && (
                        <div>
                          <p className="text-gray-500">{t('budgetTracking.actualCost')}</p>
                          <p className="font-semibold">{formatCurrency(impact.actualCost)}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-gray-500">{t('budgetTracking.costVariance')}</p>
                        <p className={`font-semibold ${impact.actualCost && impact.actualCost < impact.estimatedCost ? 'text-green-600' : 'text-red-600'}`}>
                          {impact.actualCost 
                            ? formatCurrency(impact.actualCost - impact.estimatedCost)
                            : t('budgetTracking.pending')
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
