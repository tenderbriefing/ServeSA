'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

/**
 * Public case view stub. Uses /case?id=CASE-… or /case/CASE-… via hosting rewrite.
 * Contact fields are never rendered from client Firestore.
 */
export default function CasePage() {
  const [caseId, setCaseId] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const path = window.location.pathname.replace(/\/$/, '')
    const fromPath = path.startsWith('/case/') ? path.slice('/case/'.length) : ''
    const fromQuery = new URLSearchParams(window.location.search).get('id') || ''
    setCaseId(decodeURIComponent(fromPath || fromQuery))
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
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Case {caseId || '(missing id)'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>
              This is a privacy-preserving case stub. Reporter contact details are never
              shown on the public share page.
            </p>
            <div className="flex gap-2">
              <Link href="/report">
                <Button variant="outline">Report another issue</Button>
              </Link>
              <Link href="/">
                <Button>Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
