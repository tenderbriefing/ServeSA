'use client'

import Link from 'next/link'
import {
  Camera,
  CheckCircle2,
  FileSearch,
  MapPin,
  Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CivicHero } from '@/components/civic/CivicHero'
import { ActionCard } from '@/components/civic/ActionCard'
import { CivicYDivider } from '@/components/civic/CivicMotif'
import { categoryOutlineIcon } from '@/components/civic/categoryIcons'
import { useAuth } from '@/hooks/useAuth'
import { Spinner } from '@/components/ui/LoadingSkeleton'
import { brandCopy } from '@/lib/design-tokens'

const categories = [
  {
    id: 'water-sewage',
    name: 'Water & sanitation',
    description: 'Leaks, sewer overflows, no water',
  },
  {
    id: 'electricity',
    name: 'Electricity',
    description: 'Outages, exposed cables, street lights',
  },
  {
    id: 'roads-infrastructure',
    name: 'Roads & infrastructure',
    description: 'Potholes, storm damage, traffic signs',
  },
  {
    id: 'waste-management',
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
      <CivicHero
        secondaryHref={user ? '/dashboard' : '/case'}
        secondaryLabel={user ? 'View My Cases' : 'Track a Case'}
      />

      <section className="border-b border-border bg-surface py-14">
        <div className="container">
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <h2 className="font-display text-h2 text-ink">How it works</h2>
            <p className="mt-3 text-body-lg text-ink-muted">
              Three clear steps. One case number. Progress you can follow.
            </p>
          </div>
          <ol className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-3">
            {[
              {
                step: '1',
                title: 'Describe the issue',
                body: 'Choose a category, add a clear title and description, and attach at least one photo.',
              },
              {
                step: '2',
                title: 'Confirm Your Location',
                body: 'Pin the place on a map, search an address, or use device GPS inside South Africa — only when you choose to.',
              },
              {
                step: '3',
                title: 'Get a Case Number',
                body: 'After submission you receive a case number. Use it to track progress or follow up.',
              },
            ].map((item) => (
              <li key={item.step} className="text-center sm:text-left">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-sm font-semibold text-white">
                  {item.step}
                </span>
                <h3 className="mt-4 font-display text-h4 text-ink">{item.title}</h3>
                <p className="mt-2 text-body-sm text-ink-muted">{item.body}</p>
              </li>
            ))}
          </ol>
          <div className="mx-auto mt-10 max-w-2xl rounded-md border border-info-border bg-info-tint p-4 text-body-sm text-info">
            <p className="font-medium">Is Serve SA official?</p>
            <p className="mt-1">
              Serve SA is a civic platform that routes reports to municipal
              teams. It is not a replacement for emergency services — if
              someone is in immediate danger, call the appropriate emergency
              number.
            </p>
          </div>
        </div>
      </section>

      <CivicYDivider />

      <section className="border-b border-border bg-surface-muted/50 py-14">
        <div className="container">
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <h2 className="font-display text-h2 text-ink">Common report types</h2>
            <p className="mt-3 text-ink-muted">
              Start with the category that best matches what you see.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <ActionCard
                key={category.name}
                href="/report"
                title={category.name}
                description={category.description}
                icon={categoryOutlineIcon(category.id)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-surface py-14">
        <div className="container">
          <ul className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
            <li className="flex items-start gap-3 rounded-md border border-border bg-canvas p-4">
              <Shield className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" aria-hidden />
              <span className="text-body-sm text-ink-muted">
                Secure submission with a case number you can keep
              </span>
            </li>
            <li className="flex items-start gap-3 rounded-md border border-border bg-canvas p-4">
              <Camera className="mt-0.5 h-5 w-5 shrink-0 text-green-600" aria-hidden />
              <span className="text-body-sm text-ink-muted">
                Photos required so officials can see the issue
              </span>
            </li>
            <li className="flex items-start gap-3 rounded-md border border-border bg-canvas p-4">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" aria-hidden />
              <span className="text-body-sm text-ink-muted">
                Your Location by map, address, or device GPS
              </span>
            </li>
            <li className="flex items-start gap-3 rounded-md border border-border bg-canvas p-4">
              <FileSearch className="mt-0.5 h-5 w-5 shrink-0 text-green-600" aria-hidden />
              <span className="text-body-sm text-ink-muted">
                Track progress with your case number
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section className="py-14">
        <div className="container">
          <div className="relative mx-auto max-w-3xl overflow-hidden rounded-xl border border-border bg-surface px-6 py-10 text-center sm:px-10">
            <CheckCircle2
              className="mx-auto h-10 w-10 text-green-600"
              aria-hidden
            />
            <h2 className="mt-4 font-display text-h2 text-ink">
              Already reported something?
            </h2>
            <p className="mt-3 text-ink-muted">
              Enter your case number to see the latest status, or sign in to
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
            <p className="mt-6 text-caption text-ink-subtle">
              {brandCopy.tagline}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
