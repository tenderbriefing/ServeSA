'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { 
  MapPin, 
  AlertTriangle, 
  Clock, 
  Users, 
  Shield, 
  BarChart3,
  ArrowRight,
  CheckCircle
} from 'lucide-react'
import { AuthGate } from '@/components/Auth/AuthGate'

export default function HomePage() {
  return (
    <AuthGate>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white">
        <div className="container mx-auto px-4 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="outline" className="mb-4">
                🚀 Pilot Ready
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                Report Municipal Issues
                <span className="text-primary-600 block">Instantly</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                ServeSA connects citizens with local government to report and track service delivery issues. 
                Get real-time updates on your reports and see the impact in your community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/report">
                  <Button size="lg" className="w-full sm:w-auto">
                    Report an Issue
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/explore">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Explore Cases
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-8 text-white">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-6 h-6" />
                    <span className="font-semibold">Johannesburg, Ward 58</span>
                  </div>
                  <h3 className="text-xl font-bold">Water Leak Reported</h3>
                  <p className="text-primary-100">Main street pipe burst affecting 50+ households</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">High Priority</Badge>
                    <span className="text-sm">2 hours ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              How ServeSA Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simple, fast, and transparent reporting system for municipal service delivery
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-primary-600" />
                </div>
                <CardTitle>1. Report Issue</CardTitle>
                <CardDescription>
                  Take a photo and describe the problem. Our AI helps categorize and prioritize your report.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-primary-600" />
                </div>
                <CardTitle>2. Track Progress</CardTitle>
                <CardDescription>
                  Get real-time updates on your case status, estimated resolution time, and progress notifications.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-primary-600" />
                </div>
                <CardTitle>3. Issue Resolved</CardTitle>
                <CardDescription>
                  Receive confirmation when your issue is resolved and see the impact on your community.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl lg:text-4xl font-bold mb-2">4,237</div>
              <div className="text-primary-100">Cases Reported</div>
            </div>
            <div>
              <div className="text-3xl lg:text-4xl font-bold mb-2">89%</div>
              <div className="text-primary-100">Resolution Rate</div>
            </div>
            <div>
              <div className="text-3xl lg:text-4xl font-bold mb-2">24h</div>
              <div className="text-primary-100">Avg Response Time</div>
            </div>
            <div>
              <div className="text-3xl lg:text-4xl font-bold mb-2">156</div>
              <div className="text-primary-100">Active Wards</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Report Any Issue
            </h2>
            <p className="text-xl text-gray-600">
              From water leaks to road damage, we handle all municipal service requests
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'Water & Sewage', count: 1247, sla: '24h', color: 'bg-blue-100 text-blue-600' },
              { name: 'Electricity', count: 892, sla: '4h', color: 'bg-yellow-100 text-yellow-600' },
              { name: 'Roads & Infrastructure', count: 2156, sla: '72h', color: 'bg-gray-100 text-gray-600' },
              { name: 'Waste Management', count: 634, sla: '48h', color: 'bg-green-100 text-green-600' },
              { name: 'Digital Services', count: 156, sla: '168h', color: 'bg-purple-100 text-purple-600' },
              { name: 'Emergency Services', count: 89, sla: '1h', color: 'bg-red-100 text-red-600' }
            ].map((category) => (
              <Link key={category.name} href={`/report?category=${category.name.toLowerCase().replace(/\s+/g, '-')}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${category.color}`}>
                        <MapPin className="w-6 h-6" />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {category.sla}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary-600 transition-colors">
                      {category.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-sm text-gray-500">
                      {category.count.toLocaleString()} reports
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of citizens who are actively improving their communities through ServeSA
          </p>
          <Link href="/report">
            <Button size="lg" variant="secondary">
              Start Reporting Now
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>
      </div>
    </AuthGate>
  )
}
