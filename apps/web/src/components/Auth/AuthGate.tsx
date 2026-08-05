'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/LoadingSkeleton'

interface AuthGateProps {
  children: React.ReactNode
  /** Where to send the user after signing in. */
  next?: string
  title?: string
  description?: string
}

/**
 * Require authentication for citizen account pages (My Cases, notifications).
 * Public journeys such as home, report, and track-a-case must not use this gate.
 */
export function AuthGate({
  children,
  next = '/dashboard',
  title = 'Sign in to continue',
  description = 'Your cases and notifications are available after you sign in. Reporting an issue does not require an account.',
}: AuthGateProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return <Spinner label="Checking your session…" />
  }

  if (!user) {
    const signInHref = `/auth/signin?next=${encodeURIComponent(next)}`
    return (
      <div className="container flex min-h-[50vh] items-center justify-center py-16">
        <div className="w-full max-w-md rounded-lg border border-border bg-surface p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-ink">{title}</h1>
          <p className="mt-3 text-sm text-ink-muted">{description}</p>
          <div className="mt-6 flex flex-col gap-3">
            <Link href={signInHref}>
              <Button className="min-h-touch w-full">Sign in</Button>
            </Link>
            <Link href="/auth">
              <Button variant="outline" className="min-h-touch w-full">
                Create account
              </Button>
            </Link>
            <Link href="/report" className="text-sm text-primary-700 hover:underline">
              Or report an issue without signing in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
