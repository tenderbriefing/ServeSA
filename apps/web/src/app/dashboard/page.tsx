'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/LoadingSkeleton'
import { AuthGate } from '@/components/Auth/AuthGate'
import { useAuth } from '@/hooks/useAuth'
import { Calendar, MapPin, Plus, Search } from 'lucide-react'

type CitizenCase = {
  id: string
  caseId?: string
  title: string
  description: string
  status: string
  priority?: string
  location: string
  createdAt: string
  estimatedResolution?: string
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [cases, setCases] = useState<CitizenCase[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.uid) return

    setLoading(true)
    setLoadError(null)

    try {
      const casesQuery = query(
        collection(db, 'cases'),
        where('reporterUid', '==', user.uid),
        orderBy('createdAt', 'desc')
      )

      const unsubscribe = onSnapshot(
        casesQuery,
        (snapshot) => {
          const casesData: CitizenCase[] = snapshot.docs.map((docSnapshot) => {
            const data = docSnapshot.data()
            return {
              id: docSnapshot.id,
              caseId: data.caseId,
              title:
                data.title ||
                (data.description
                  ? `${String(data.description).slice(0, 50)}…`
                  : 'Untitled case'),
              description: data.description || '',
              status: data.status || 'submitted',
              priority: data.priority || data.severity,
              location:
                data.location?.address ||
                data.address ||
                [data.location?.wardName, data.location?.municipalityName]
                  .filter(Boolean)
                  .join(', ') ||
                'Location captured',
              createdAt:
                data.createdAt?.toDate?.()?.toISOString?.() ||
                new Date().toISOString(),
              estimatedResolution: data.slaTarget?.toDate?.()?.toISOString?.(),
            }
          })
          setCases(casesData)
          setLoading(false)
        },
        (error) => {
          console.error('Error loading cases:', error)
          setLoadError(
            'We could not load your cases right now. Check your connection and try again.'
          )
          setLoading(false)
        }
      )

      return () => unsubscribe()
    } catch (error) {
      console.error('Error setting up cases listener:', error)
      setLoadError(
        'We could not load your cases right now. Check your connection and try again.'
      )
      setLoading(false)
    }
  }, [user?.uid])

  const stats = {
    total: cases.length,
    active: cases.filter((c) => !['resolved', 'closed'].includes(c.status))
      .length,
    resolved: cases.filter((c) =>
      ['resolved', 'closed'].includes(c.status)
    ).length,
  }

  const filteredCases = cases.filter((caseItem) => {
    let matchesTab = true
    if (activeTab === 'active') {
      matchesTab = !['resolved', 'closed'].includes(caseItem.status)
    } else if (activeTab === 'resolved') {
      matchesTab = ['resolved', 'closed'].includes(caseItem.status)
    }

    const haystack = `${caseItem.title} ${caseItem.description} ${caseItem.location} ${caseItem.id}`.toLowerCase()
    const matchesSearch =
      searchTerm === '' || haystack.includes(searchTerm.toLowerCase())
    return matchesTab && matchesSearch
  })

  return (
    <AuthGate
      next="/dashboard"
      title="Sign in to view My Cases"
      description="Cases linked to your account appear here. You can still track a case with a reference number without signing in."
    >
      <div className="bg-canvas">
        <div className="container py-8">
          <PageHeader
            title="My Cases"
            description="Track the reports linked to your account."
            actions={
              <Link href="/report">
                <Button className="min-h-touch">
                  <Plus className="mr-2 h-4 w-4" aria-hidden />
                  Report an Issue
                </Button>
              </Link>
            }
          />

          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Total', value: stats.total },
              { label: 'Open', value: stats.active },
              { label: 'Resolved', value: stats.resolved },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-ink-muted">
                    {stat.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-ink">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
                aria-hidden
              />
              <label htmlFor="case-search" className="sr-only">
                Search cases
              </label>
              <input
                id="case-search"
                type="search"
                placeholder="Search by title, place, or reference"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="min-h-touch w-full rounded-md border border-input bg-surface py-2 pl-10 pr-4 text-base"
              />
            </div>
          </div>

          <div
            className="mb-6 flex gap-1 overflow-x-auto rounded-lg border border-border bg-surface p-1"
            role="tablist"
            aria-label="Case filters"
          >
            {[
              { id: 'all', label: 'All' },
              { id: 'active', label: 'Open' },
              { id: 'resolved', label: 'Resolved' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-touch flex-1 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-700 text-white'
                    : 'text-ink-muted hover:bg-surface-muted hover:text-ink'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <Spinner label="Loading your cases…" />
          ) : loadError ? (
            <EmptyState title="Could not load cases" description={loadError} />
          ) : filteredCases.length === 0 ? (
            <EmptyState
              title="No cases yet"
              description="When you submit a report while signed in, it will appear here. You can also track any case with its reference number."
              action={
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link href="/report">
                    <Button className="min-h-touch">Report an Issue</Button>
                  </Link>
                  <Link href="/case">
                    <Button variant="outline" className="min-h-touch">
                      Track a Case
                    </Button>
                  </Link>
                </div>
              }
            />
          ) : (
            <ul className="space-y-4">
              {filteredCases.map((caseItem) => (
                <li key={caseItem.id}>
                  <Card className="transition-shadow hover:shadow-md">
                    <CardHeader>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <h2 className="text-lg font-semibold text-ink">
                              {caseItem.title}
                            </h2>
                            <StatusBadge status={caseItem.status} />
                          </div>
                          <p className="text-sm text-ink-muted">
                            {caseItem.description}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-4 text-sm text-ink-subtle">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-4 w-4" aria-hidden />
                              {caseItem.location}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-4 w-4" aria-hidden />
                              {new Date(caseItem.createdAt).toLocaleDateString(
                                'en-ZA'
                              )}
                            </span>
                          </div>
                        </div>
                        <Link
                          href={`/case?id=${encodeURIComponent(
                            caseItem.caseId || caseItem.id
                          )}`}
                        >
                          <Button variant="outline" className="min-h-touch">
                            View case
                          </Button>
                        </Link>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-ink-muted">
                        <span className="font-medium text-ink">Reference:</span>{' '}
                        <span className="font-mono">
                          {caseItem.caseId || caseItem.id}
                        </span>
                      </p>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AuthGate>
  )
}
