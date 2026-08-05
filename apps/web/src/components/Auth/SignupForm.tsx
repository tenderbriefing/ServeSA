'use client'
import { useState } from 'react'
import { signInWithGoogle, signUpWithEmail } from '@/lib/auth'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { AlertCircle, Mail, Lock, Eye, EyeOff, User, Phone } from 'lucide-react'
import {
  southAfricaProvinces,
  getMunicipalitiesByProvince,
  type Municipality,
} from '@/lib/southAfricaData'
import { AlertBanner } from '@/components/ui/AlertBanner'

interface SignupFormProps {
  onSuccess?: () => void
  onSwitchToLogin?: () => void
}

function isValidSaMobile(value: string): boolean {
  if (!value.trim()) return true
  const digits = value.replace(/\D/g, '')
  return /^(0\d{9}|27\d{9})$/.test(digits)
}

export function SignupForm({ onSuccess, onSwitchToLogin }: SignupFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    province: '',
    municipality: '',
  })
  const [availableMunicipalities, setAvailableMunicipalities] = useState<
    Municipality[]
  >([])
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })

    if (field === 'province') {
      const municipalities = getMunicipalitiesByProvince(value)
      setAvailableMunicipalities(municipalities)
      setFormData((prev) => ({ ...prev, municipality: '' }))
    }
  }

  const validate = () => {
    const errors: Record<string, string> = {}
    if (formData.firstName.trim().length < 2) {
      errors.firstName = 'Enter your first name.'
    }
    if (formData.lastName.trim().length < 2) {
      errors.lastName = 'Enter your surname.'
    }
    if (!formData.email.includes('@')) {
      errors.email = 'Enter a valid email address, such as name@example.co.za.'
    }
    if (formData.password.length < 8) {
      errors.password = 'Choose a password with at least 8 characters.'
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.'
    }
    if (!isValidSaMobile(formData.phone)) {
      errors.phone =
        'Enter a South African mobile number, such as 082 123 4567.'
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!validate()) return

    setIsLoading(true)
    try {
      await signUpWithEmail(formData.email, formData.password, {
        displayName: `${formData.firstName} ${formData.lastName}`,
        municipalityCode: formData.municipality || undefined,
        phone: formData.phone || undefined,
      })
      onSuccess?.()
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'We could not create your account. Check your details and try again.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setIsLoading(true)
    setError('')
    try {
      await signInWithGoogle()
      onSuccess?.()
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Google sign-in did not complete. Try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Create account</CardTitle>
        <CardDescription>
          Create an account to save your cases and receive updates. You can also
          report without signing in.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <AlertBanner variant="info">
          Province and municipality are optional now — you can add them later in
          your profile. Reporting does not wait on a complete profile.
        </AlertBanner>

        {error && (
          <Alert variant="destructive" role="alert">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {Object.keys(fieldErrors).length > 0 && (
          <div
            className="rounded-md border border-danger-border bg-danger-tint p-3 text-sm text-danger"
            role="alert"
          >
            <p className="font-semibold">There is a problem with your form</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {Object.values(fieldErrors).map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleEmailSignup} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 xs:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="signup-first-name" className="text-sm font-medium">
                First name <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
                  aria-hidden
                />
                <Input
                  id="signup-first-name"
                  autoComplete="given-name"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Thabo"
                  className="min-h-touch pl-10"
                  required
                  aria-invalid={Boolean(fieldErrors.firstName)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="signup-last-name" className="text-sm font-medium">
                Surname <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
                  aria-hidden
                />
                <Input
                  id="signup-last-name"
                  autoComplete="family-name"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Mokoena"
                  className="min-h-touch pl-10"
                  required
                  aria-invalid={Boolean(fieldErrors.lastName)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="signup-email" className="text-sm font-medium">
              Email <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
                aria-hidden
              />
              <Input
                id="signup-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="name@example.co.za"
                className="min-h-touch pl-10"
                required
                aria-invalid={Boolean(fieldErrors.email)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="signup-phone" className="text-sm font-medium">
              Mobile number <span className="text-ink-subtle">(optional)</span>
            </label>
            <div className="relative">
              <Phone
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
                aria-hidden
              />
              <Input
                id="signup-phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="082 123 4567"
                className="min-h-touch pl-10"
                aria-invalid={Boolean(fieldErrors.phone)}
                aria-describedby="signup-phone-hint"
              />
            </div>
            <p id="signup-phone-hint" className="text-xs text-ink-subtle">
              South African mobile numbers only, for example 082 123 4567.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Province <span className="text-ink-subtle">(optional)</span>
            </label>
            <Select
              value={formData.province}
              onValueChange={(value) => handleInputChange('province', value)}
            >
              <SelectTrigger className="min-h-touch" aria-label="Province">
                <SelectValue placeholder="Select your province" />
              </SelectTrigger>
              <SelectContent>
                {southAfricaProvinces.map((province) => (
                  <SelectItem key={province.code} value={province.code}>
                    {province.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Municipality <span className="text-ink-subtle">(optional)</span>
            </label>
            <Select
              value={formData.municipality}
              onValueChange={(value) => handleInputChange('municipality', value)}
              disabled={!formData.province}
            >
              <SelectTrigger className="min-h-touch" aria-label="Municipality">
                <SelectValue
                  placeholder={
                    formData.province
                      ? 'Select your municipality'
                      : 'Select a province first'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableMunicipalities.map((municipality) => (
                  <SelectItem key={municipality.code} value={municipality.code}>
                    {municipality.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="signup-password" className="text-sm font-medium">
              Password <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
                aria-hidden
              />
              <Input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="At least 8 characters"
                className="min-h-touch pl-10 pr-12"
                required
                aria-invalid={Boolean(fieldErrors.password)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center"
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

          <div className="space-y-2">
            <label
              htmlFor="signup-confirm-password"
              className="text-sm font-medium"
            >
              Confirm password <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
                aria-hidden
              />
              <Input
                id="signup-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleInputChange('confirmPassword', e.target.value)
                }
                placeholder="Re-enter your password"
                className="min-h-touch pl-10 pr-12"
                required
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center"
                aria-label={
                  showConfirmPassword
                    ? 'Hide confirm password'
                    : 'Show confirm password'
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-ink-subtle" aria-hidden />
                ) : (
                  <Eye className="h-4 w-4 text-ink-subtle" aria-hidden />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="min-h-touch w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Creating account…' : 'Create account'}
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
          onClick={handleGoogleSignup}
          className="min-h-touch w-full"
          disabled={isLoading}
          type="button"
        >
          Continue with Google
        </Button>

        {onSwitchToLogin && (
          <div className="text-center text-sm">
            <span className="text-ink-muted">Already have an account? </span>
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-medium text-primary-700 hover:underline"
            >
              Sign in
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
