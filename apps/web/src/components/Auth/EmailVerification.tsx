'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert, AlertDescription } from '@/components/ui/Alert'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { 
  Mail, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  ArrowLeft,
  RefreshCw
} from 'lucide-react'

export function EmailVerification() {
  const { user } = useAuth()
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showPasswordReset, setShowPasswordReset] = useState(false)

  const handleSendVerification = async () => {
    if (!user) return
    
    setIsVerifying(true)
    setMessage(null)
    
    try {
      await sendEmailVerification(user)
      setMessage({ 
        type: 'success', 
        text: 'Verification email sent! Please check your inbox and spam folder.' 
      })
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to send verification email' 
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendVerification = async () => {
    if (!user) return
    
    setIsResending(true)
    setMessage(null)
    
    try {
      await sendEmailVerification(user)
      setMessage({ 
        type: 'success', 
        text: 'Verification email resent! Please check your inbox.' 
      })
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to resend verification email' 
      })
    } finally {
      setIsResending(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetEmail) return
    
    setIsResetting(true)
    setMessage(null)
    
    try {
      await sendPasswordResetEmail(auth, resetEmail)
      setMessage({ 
        type: 'success', 
        text: 'Password reset email sent! Please check your inbox.' 
      })
      setResetEmail('')
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to send password reset email' 
      })
    } finally {
      setIsResetting(false)
    }
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Authentication Required
          </CardTitle>
          <CardDescription>
            Please sign in to access email verification features
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (user.emailVerified) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Email Verified
          </CardTitle>
          <CardDescription>
            Your email address has been successfully verified
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">{user.email}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Email Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-500" />
            Verify Your Email
          </CardTitle>
          <CardDescription>
            Please verify your email address to access all platform features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span className="text-sm">{user.email}</span>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleSendVerification}
              disabled={isVerifying}
              className="flex-1"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Verification Email'
              )}
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleResendVerification}
              disabled={isResending}
            >
              {isResending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>

          {message && (
            <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Password Reset */}
      <Card>
        <CardHeader>
          <CardTitle>Password Reset</CardTitle>
          <CardDescription>
            Forgot your password? We can send you a reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showPasswordReset ? (
            <Button 
              variant="outline" 
              onClick={() => setShowPasswordReset(true)}
              className="w-full"
            >
              Reset Password
            </Button>
          ) : (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetEmail">Email Address</Label>
                <Input
                  id="resetEmail"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  type="submit"
                  disabled={isResetting || !resetEmail}
                  className="flex-1"
                >
                  {isResetting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
                
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setShowPasswordReset(false)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
