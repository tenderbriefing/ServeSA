'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Shield, 
  Users, 
  MapPin, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  ArrowRight,
  LogIn,
  UserPlus
} from 'lucide-react'
import Link from 'next/link'

interface AuthGateProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthGate({ children, fallback }: AuthGateProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [showFallback, setShowFallback] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      setShowFallback(true)
    }
  }, [user, loading])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ServeSA...</p>
        </div>
      </div>
    )
  }

  if (showFallback) {
    return fallback || <DefaultAuthFallback />
  }

  return <>{children}</>
}

function DefaultAuthFallback() {
  return (
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
              
              {/* Authentication Cards */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <Card className="border-2 border-primary-200 hover:border-primary-300 transition-colors">
                  <CardHeader className="text-center pb-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <LogIn className="w-6 h-6 text-primary-600" />
                    </div>
                    <CardTitle className="text-xl">Already a Member?</CardTitle>
                    <CardDescription>
                      Sign in to access your dashboard and track your reports
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center pt-0">
                    <Link href="/auth/login">
                      <Button className="w-full">
                        Sign In
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="border-2 border-green-200 hover:border-green-300 transition-colors">
                  <CardHeader className="text-center pb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <UserPlus className="w-6 h-6 text-green-600" />
                    </div>
                    <CardTitle className="text-xl">New to ServeSA?</CardTitle>
                    <CardDescription>
                      Create your account and start making a difference in your community
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center pt-0">
                    <Link href="/auth/signup">
                      <Button variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-50">
                        Create Account
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-500 mb-4">
                  Join thousands of citizens improving their communities
                </p>
                <div className="flex justify-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Shield className="w-4 h-4 mr-2" />
                    Secure & Private
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Community Driven
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    Location Based
                  </div>
                </div>
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

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of citizens who are actively improving their communities through ServeSA
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" variant="secondary">
                Create Account
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary-600">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
