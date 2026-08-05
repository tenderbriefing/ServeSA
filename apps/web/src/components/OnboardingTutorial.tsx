'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Camera, CheckCircle, MapPin, X } from 'lucide-react'

const STORAGE_KEY = 'servesa.onboarding.completed'

export function OnboardingTutorial() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()

  useEffect(() => {
    if (!user) return
    const completed = localStorage.getItem(STORAGE_KEY)
    if (!completed) setIsOpen(true)
  }, [user])

  useEffect(() => {
    if (!isOpen) return
    closeRef.current?.focus()
    const previous = document.activeElement as HTMLElement | null
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') completeOnboarding()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previous?.focus?.()
    }
  }, [isOpen])

  const completeOnboarding = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setIsOpen(false)
  }

  const steps = [
    {
      title: 'Welcome to Serve SA',
      description: 'Report local service issues and track progress.',
      icon: <MapPin className="h-8 w-8 text-primary-700" aria-hidden />,
      body: (
        <p className="text-ink-muted">
          You can report without completing a long profile. Keep your case
          reference — that is how you follow up.
        </p>
      ),
    },
    {
      title: 'How reporting works',
      description: 'Three short steps, then a reference number.',
      icon: <Camera className="h-8 w-8 text-primary-700" aria-hidden />,
      body: (
        <ol className="space-y-3 text-sm text-ink-muted">
          <li>1. Choose a category and describe the issue.</li>
          <li>2. Confirm the place (map, address, or device location).</li>
          <li>3. Add at least one photo and submit.</li>
        </ol>
      ),
    },
    {
      title: 'Ready when you are',
      description: 'Start a report or browse your cases.',
      icon: <CheckCircle className="h-8 w-8 text-secondary-600" aria-hidden />,
      body: (
        <p className="text-ink-muted">
          If someone is in immediate danger, contact emergency services first.
          Serve SA routes non-emergency service issues to the responsible
          authority.
        </p>
      ),
    },
  ]

  if (!isOpen) return null

  const step = steps[currentStep]

  return (
    <div
      className="fixed inset-0 z-modal flex items-center justify-center bg-ink/50 p-4"
      role="presentation"
    >
      <Card
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg"
      >
        <CardHeader className="relative">
          <Button
            ref={closeRef}
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 min-h-touch min-w-touch"
            onClick={completeOnboarding}
            aria-label="Close introduction"
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
          <div className="flex items-start gap-3 pr-10">
            {step.icon}
            <div>
              <CardTitle id={titleId}>{step.title}</CardTitle>
              <CardDescription>{step.description}</CardDescription>
            </div>
          </div>
          <div
            className="mt-4 flex gap-2"
            aria-label={`Step ${currentStep + 1} of ${steps.length}`}
          >
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded ${
                  index <= currentStep ? 'bg-primary-700' : 'bg-border'
                }`}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {step.body}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
              disabled={currentStep === 0}
              className="min-h-touch"
            >
              Back
            </Button>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="ghost" onClick={completeOnboarding} className="min-h-touch">
                Skip
              </Button>
              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={() => setCurrentStep((s) => s + 1)}
                  className="min-h-touch"
                >
                  Next
                </Button>
              ) : (
                <Link href="/report" onClick={completeOnboarding}>
                  <Button className="min-h-touch w-full">Report an Issue</Button>
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
