'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { seedDatabase, isDatabaseSeeded } from '@/lib/seedDatabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert, AlertDescription } from '@/components/ui/Alert'
import { 
  Database, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  Users,
  FileText,
  MessageSquare,
  TrendingUp
} from 'lucide-react'

export default function AdminDataPage() {
  const { isAdmin } = useAuth()
  const [isSeeding, setIsSeeding] = useState(false)
  const [isSeeded, setIsSeeded] = useState(false)
  const [seedingResult, setSeedingResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)

  const handleSeedDatabase = async () => {
    setIsSeeding(true)
    setSeedingResult(null)
    
    try {
      const result = await seedDatabase()
      setSeedingResult(result)
      if (result.success) {
        setIsSeeded(true)
      }
    } catch (error) {
      setSeedingResult({ success: false, error: 'Failed to seed database' })
    } finally {
      setIsSeeding(false)
    }
  }

  const checkSeedStatus = async () => {
    try {
      const seeded = await isDatabaseSeeded()
      setIsSeeded(seeded)
    } catch (error) {
      console.error('Error checking seed status:', error)
    }
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access the data management page.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Data Management</h1>
        <p className="text-muted-foreground">
          Manage platform data and seed initial content
        </p>
      </div>

      {/* Database Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Status
          </CardTitle>
          <CardDescription>
            Current status of platform data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isSeeded ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-green-600 font-medium">Database is seeded</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <span className="text-yellow-600 font-medium">Database needs seeding</span>
                </>
              )}
            </div>
            <Button variant="outline" onClick={checkSeedStatus}>
              Check Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Seed Database */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Seed Database</CardTitle>
          <CardDescription>
            Populate the database with initial data including departments, categories, and sample content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <Users className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">5 Departments</p>
                  <p className="text-xs text-muted-foreground">Municipal departments</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <FileText className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">6 Categories</p>
                  <p className="text-xs text-muted-foreground">Service categories</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <MessageSquare className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">3 Forum Topics</p>
                  <p className="text-xs text-muted-foreground">Community discussions</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <TrendingUp className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">3 Votable Issues</p>
                  <p className="text-xs text-muted-foreground">Community voting</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleSeedDatabase} 
              disabled={isSeeding || isSeeded}
              className="w-full"
            >
              {isSeeding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Seeding Database...
                </>
              ) : isSeeded ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Database Already Seeded
                </>
              ) : (
                'Seed Database'
              )}
            </Button>

            {seedingResult && (
              <Alert className={seedingResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <AlertDescription className={seedingResult.success ? 'text-green-800' : 'text-red-800'}>
                  {seedingResult.success ? seedingResult.message : seedingResult.error}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Management Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management Actions</CardTitle>
          <CardDescription>
            Additional data management tools and utilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" disabled>
              Export Data
            </Button>
            <Button variant="outline" disabled>
              Import Data
            </Button>
            <Button variant="outline" disabled>
              Backup Database
            </Button>
            <Button variant="outline" disabled>
              Clear Test Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
