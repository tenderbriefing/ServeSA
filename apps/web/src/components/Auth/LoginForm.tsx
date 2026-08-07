'use client'
import { useState } from 'react'
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card'
import { Alert, AlertDescription } from '@/components/ui/Alert'
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'

interface LoginFormProps {
  onSuccess?: () => void
  onSwitchToSignup?: () => void
  /** When true, omit the card title/description (page already provides heading). */
  hideHeader?: boolean
}

function friendlyAuthError(code?: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'Enter a valid email address, such as name@example.co.za.'
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact support@servesa.co.za for help.'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email or password is incorrect. Check your details and try again.'
    case 'auth/too-many-requests':
      return 'Too many sign-in attempts. Wait a few minutes and try again.'
    case 'auth/network-request-failed':
      return 'We could not reach the sign-in service. Check your connection and try again.'
    case 'auth/popup-closed-by-user':
      return 'The Google sign-in window was closed before finishing.'
    default:
      return 'We could not sign you in. Check your details and try again.'
  }
}

export function LoginForm({ onSuccess, onSwitchToSignup, hideHeader }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await signInWithEmailAndPassword(auth, email, password)
      onSuccess?.()
    } catch (err: unknown) {
      const code =
        err && typeof err === 'object' && 'code' in err
          ? String((err as { code: string }).code)
          : undefined
      setError(friendlyAuthError(code))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError('')

    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      onSuccess?.()
    } catch (err: unknown) {
      const code =
        err && typeof err === 'object' && 'code' in err
          ? String((err as { code: string }).code)
          : undefined
      setError(friendlyAuthError(code))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      {!hideHeader && (
        <CardHeader className="text-center">
          <CardTitle className="font-display text-2xl font-bold">Sign in</CardTitle>
          <CardDescription>
            Welcome back. Sign in to view your cases and notifications.
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" role="alert">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4" noValidate>
          <div className="space-y-2">
            <label htmlFor="login-email" className="text-sm font-medium">
              Email <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
                aria-hidden
              />
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.co.za"
                className="min-h-touch pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="login-password" className="text-sm font-medium">
              Password <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
                aria-hidden
              />
              <Input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="min-h-touch pl-10 pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-ink-subtle" aria-hidden />
                ) : (
                  <Eye className="h-4 w-4 text-ink-subtle" aria-hidden />
                )}
              </button>
            </div>
          </div>

          <Button type="submit" className="min-h-touch w-full" disabled={isLoading}>
            {isLoading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-surface px-2 text-ink-subtle">or</span>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={handleGoogleLogin}
          className="min-h-touch w-full"
          disabled={isLoading}
          type="button"
        >
          Continue with Google
        </Button>

        {onSwitchToSignup && (
          <div className="text-center text-sm">
            <span className="text-ink-muted">Don&apos;t have an account? </span>
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="font-medium text-primary-700 hover:underline"
            >
              Create account
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
