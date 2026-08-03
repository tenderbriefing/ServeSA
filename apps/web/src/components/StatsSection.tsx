'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { TrendingUp, Users, MapPin, Clock, CheckCircle, AlertTriangle } from 'lucide-react'

const stats = [
  {
    title: 'Total Reports',
    value: '45,892',
    change: '+12.5%',
    changeType: 'positive' as const,
    description: 'From last month',
    icon: TrendingUp,
    color: 'bg-blue-100 text-blue-600'
  },
  {
    title: 'Active Users',
    value: '12,847',
    change: '+8.2%',
    changeType: 'positive' as const,
    description: 'This month',
    icon: Users,
    color: 'bg-green-100 text-green-600'
  },
  {
    title: 'Municipalities',
    value: '257',
    change: '+3',
    changeType: 'positive' as const,
    description: 'Covered',
    icon: MapPin,
    color: 'bg-purple-100 text-purple-600'
  },
  {
    title: 'Avg Response Time',
    value: '2.4h',
    change: '-15.3%',
    changeType: 'positive' as const,
    description: 'Faster than last month',
    icon: Clock,
    color: 'bg-orange-100 text-orange-600'
  },
  {
    title: 'Resolved Cases',
    value: '38,456',
    change: '+18.7%',
    changeType: 'positive' as const,
    description: 'This month',
    icon: CheckCircle,
    color: 'bg-emerald-100 text-emerald-600'
  },
  {
    title: 'Pending Cases',
    value: '7,436',
    change: '-5.2%',
    changeType: 'positive' as const,
    description: 'From last month',
    icon: AlertTriangle,
    color: 'bg-red-100 text-red-600'
  }
]

export function StatsSection() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Platform Impact
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            See how ServeSA is making a difference across South Africa, connecting citizens with their municipalities for better service delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat) => {
            const IconComponent = stat.icon
            return (
              <Card key={stat.title} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div className={`text-sm font-medium ${
                      stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold">
                    {stat.value}
                  </CardTitle>
                  <CardDescription className="text-base font-medium">
                    {stat.title}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-500">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            * Statistics updated in real-time from all 257 municipalities
          </p>
        </div>
      </div>
    </section>
  )
}
