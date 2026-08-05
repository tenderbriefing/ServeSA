'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoginForm } from '@/components/Auth/LoginForm'
import { SignupForm } from '@/components/Auth/SignupForm'
import { Shield } from 'lucide-react'

export default function AuthPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)

  const handleAuthSuccess = () => {
    router.push('/dashboard')
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Shield className="h-8 w-8 text-primary-700" aria-hidden />
            <h1 className="text-3xl font-bold text-ink">Serve SA</h1>
          </div>
          <p className="text-ink-muted">
            {isLogin
              ? 'Welcome back. Sign in to continue.'
              : 'Create an account to keep your cases in one place.'}
          </p>
        </div>

        {isLogin ? (
          <LoginForm
            onSuccess={handleAuthSuccess}
            onSwitchToSignup={() => setIsLogin(false)}
          />
        ) : (
          <SignupForm
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
