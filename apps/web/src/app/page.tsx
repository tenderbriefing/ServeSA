'use client'

import Link from 'next/link'
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  FileSearch,
  MapPin,
  Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'
import { Spinner } from '@/components/ui/LoadingSkeleton'

const categories = [
  {
    name: 'Water & sanitation',
    description: 'Leaks, sewer overflows, no water',
  },
  {
    name: 'Electricity',
    description: 'Outages, exposed cables, street lights',
  },
  {
    name: 'Roads & infrastructure',
    description: 'Potholes, storm damage, traffic signs',
  },
  {
    name: 'Waste management',
    description: 'Missed collection, illegal dumping',
  },
]

export default function HomePage() {
  const { user, loading } = useAuth()

  if (loading) {
    return <Spinner label="Loading Serve SA…" />
  }

  return (
    <div className="bg-canvas">
      <section className="border-b border-border bg-surface">
        <div className="container grid items-center gap-12 py-14 lg:grid-cols-2 lg:py-20">
          <div>
            <Badge
              variant="outline"
              className="mb-4 border-secondary-200 bg-secondary-50 text-secondary-700"
            >
              Civic reporting for South Africa
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">
              Report local service issues and track progress.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-muted">
              Serve SA helps you tell your municipality about service delivery
              problems, keep a reference number, and follow updates. Response
              times depend on the responsible authority — we do not invent
              promises we cannot keep.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/report">
                <Button size="lg" className="w-full min-h-touch sm:w-auto">
                  Report an Issue
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Button>
              </Link>
              <Link href={user ? '/dashboard' : '/case'}>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full min-h-touch sm:w-auto"
                >
                  {user ? 'View My Cases' : 'Track a Case'}
                </Button>
              </Link>
            </div>
            <ul className="mt-8 grid gap-3 text-sm text-ink-muted sm:grid-cols-2">
              <li className="flex items-start gap-2">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-secondary-600" aria-hidden />
                Secure submission with a case reference
              </li>
              <li className="flex items-start gap-2">
                <Camera className="mt-0.5 h-4 w-4 shrink-0 text-secondary-600" aria-hidden />
                Photos required so officials can act
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-secondary-600" aria-hidden />
                Location by map, address, or device GPS
              </li>
              <li className="flex items-start gap-2">
                <FileSearch className="mt-0.5 h-4 w-4 shrink-0 text-secondary-600" aria-hidden />
                Track progress with your reference number
              </li>
            </ul>
          </div>

          <Card className="border-border shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">What happens next</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {[
                {
                  step: '1',
                  title: 'Describe the issue',
                  body: 'Choose a category, add a clear title and description, and attach at least one photo.',
                },
                {
                  step: '2',
                  title: 'Confirm the place',
                  body: 'Pin the location on a map, search an address, or use your device location inside South Africa.',
                },
                {
                  step: '3',
                  title: 'Get a reference',
                  body: 'After submission you receive a case reference. Use it to track progress or follow up.',
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-700 text-sm font-semibold text-white">
                    {item.step}
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{item.title}</p>
                    <p className="mt-1 text-sm text-ink-muted">{item.body}</p>
                  </div>
                </div>
              ))}
              <div className="rounded-md border border-info-border bg-info-tint p-3 text-sm text-info">
                <p className="font-medium">Is Serve SA official?</p>
                <p className="mt-1">
                  Serve SA is a civic platform that routes reports to municipal
                  teams. It is not a replacement for emergency services — if
                  someone is in immediate danger, call the appropriate emergency
                  number.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="border-b border-border bg-surface-muted/60 py-16">
        <div className="container">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-ink">Common report types</h2>
            <p className="mt-3 text-ink-muted">
              Start with the category that best matches what you see. You can
              refine details in the report form.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.name}
                href="/report"
                className="rounded-lg border border-border bg-surface p-5 transition-shadow hover:shadow-md"
              >
                <h3 className="font-semibold text-ink">{category.name}</h3>
                <p className="mt-2 text-sm text-ink-muted">
                  {category.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container">
          <div className="mx-auto max-w-3xl rounded-xl border border-border bg-surface p-8 text-center shadow-sm sm:p-10">
            <CheckCircle2 className="mx-auto h-10 w-10 text-secondary-600" aria-hidden />
            <h2 className="mt-4 text-2xl font-bold text-ink">
              Already reported something?
            </h2>
            <p className="mt-3 text-ink-muted">
              Enter your case reference to see the latest status, or sign in to
              view every case linked to your account.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/case">
                <Button variant="outline" className="w-full min-h-touch sm:w-auto">
                  Track a Case
                </Button>
              </Link>
              <Link href={user ? '/dashboard' : '/auth/signin'}>
                <Button className="w-full min-h-touch sm:w-auto">
                  {user ? 'Open My Cases' : 'Sign in'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
