'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

/**
 * Public-ish case view — contact fields are never rendered from client Firestore.
 * Full details should be loaded via authenticated callable in a follow-up workstream.
 */
export default function CasePage() {
  const params = useParams<{ id: string }>()
  const caseId = params?.id || ''
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
  }, [])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Case Details</h1>
        <Card>
          <CardHeader>
            <CardTitle className="font-mono">{caseId}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Your case reference is confirmed. Detailed status tracking is available from your
              dashboard when signed in. Reporter contact information is never shown on public share
              links.
            </p>
            <div className="flex gap-3">
              <Link href="/dashboard">
                <Button>Go to dashboard</Button>
              </Link>
              <Link href="/report">
                <Button variant="outline">Report another issue</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
