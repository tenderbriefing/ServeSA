'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoginForm } from '@/components/Auth/LoginForm'
import { SignupForm } from '@/components/Auth/SignupForm'
import { CivicMotif } from '@/components/civic/CivicMotif'
import { brandCopy } from '@/lib/design-tokens'

export default function AuthPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(false)

  const handleAuthSuccess = () => {
    router.push('/dashboard')
  }

  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-canvas px-4 py-12">
      <CivicMotif variant="auth" />
      <div className="relative w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="font-display text-label text-primary-700">{brandCopy.name}</p>
          <h1 className="mt-2 font-display text-h2 text-ink">
            {isLogin ? 'Sign in' : 'Create account'}
          </h1>
          <p className="mt-2 text-body-sm text-ink-muted">
            {isLogin
              ? 'Welcome back. Sign in to continue.'
              : 'Keep your cases in one place across South Africa.'}
          </p>
        </div>

        {isLogin ? (
          <LoginForm
            hideHeader
            onSuccess={handleAuthSuccess}
            onSwitchToSignup={() => setIsLogin(false)}
          />
        ) : (
          <SignupForm
            hideHeader
            onSuccess={handleAuthSuccess}
            onSwitchToLogin={() => setIsLogin(true)}
          />
        )}

        <p className="mt-6 text-center text-sm text-ink-subtle">
          Secure platform for citizen reporting. Staff accounts are issued by
          your municipality — they are not created here.
        </p>
      </div>
    </div>
  )
}
