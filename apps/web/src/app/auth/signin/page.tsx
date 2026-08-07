'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LoginForm } from '@/components/Auth/LoginForm'
import { CivicMotif } from '@/components/civic/CivicMotif'
import { brandCopy } from '@/lib/design-tokens'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

function SignInInner() {
  const router = useRouter()
  const search = useSearchParams()
  const { user, loading } = useAuth()
  const next = search.get('next') || '/dashboard'

  useEffect(() => {
    if (!loading && user) {
      router.replace(next)
    }
  }, [user, loading, router, next])

  if (loading || user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-ink-muted">
        Preparing sign-in…
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden bg-canvas px-4 py-12">
      <CivicMotif variant="auth" />
      <div className="relative mx-auto w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="font-display text-label text-primary-700">{brandCopy.name}</p>
          <h1 className="mt-2 font-display text-h2 text-ink">Sign in</h1>
          <p className="mt-2 text-body-sm text-ink-muted">{brandCopy.tagline}</p>
        </div>
        <LoginForm
          hideHeader
          onSuccess={() => router.push(next)}
          onSwitchToSignup={() => router.push('/auth')}
        />
        <p className="mt-6 text-center text-body-sm text-ink-subtle">
          Need an account?{' '}
          <Link href="/auth" className="font-medium text-primary-700 hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-ink-muted">
          Preparing sign-in…
        </div>
      }
    >
      <SignInInner />
    </Suspense>
  )
}
