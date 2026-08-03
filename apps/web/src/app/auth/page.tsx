'use client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'
import { LoginForm } from '@/components/Auth/LoginForm'
import { SignupForm } from '@/components/Auth/SignupForm'
import { Card } from '@/components/ui/Card'
import { Shield, Users } from 'lucide-react'

export default function AuthPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)

  const handleAuthSuccess = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">ServeSA</h1>
          </div>
          <p className="text-muted-foreground">
            {isLogin ? t('auth.welcomeBack') : t('auth.joinUs')}
          </p>
        </div>

        <Card className="p-6">
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
        </Card>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>{t('auth.securePlatform')}</p>
        </div>
      </div>
    </div>
  )
}

