'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  MapPin, 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Camera, 
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  X
} from 'lucide-react'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  content: React.ReactNode
}

export function OnboardingTutorial() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem('onboarding-completed')
    if (!hasCompletedOnboarding && user) {
      setIsOpen(true)
    }
  }, [user])

  const completeOnboarding = () => {
    localStorage.setItem('onboarding-completed', 'true')
    setIsOpen(false)
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeOnboarding()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to ServeSA!',
      description: 'Your platform for better service delivery',
      icon: <MapPin className="h-8 w-8 text-primary" />,
      content: (
        <div className="space-y-4">
          <p className="text-lg text-center">
            Welcome to ServeSA, South Africa's premier platform for service delivery reporting and community engagement.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Users className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <p className="text-sm font-medium">Connect</p>
              <p className="text-xs text-muted-foreground">With your community</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <p className="text-sm font-medium">Improve</p>
              <p className="text-xs text-muted-foreground">Service delivery</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'reporting',
      title: 'Report Issues',
      description: 'Submit service delivery problems easily',
      icon: <Camera className="h-8 w-8 text-primary" />,
      content: (
        <div className="space-y-4">
          <p>Report service delivery issues in your area:</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600">1</span>
              </div>
              <p className="text-sm">Take photos or videos of the issue</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600">2</span>
              </div>
              <p className="text-sm">Add location and description</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600">3</span>
              </div>
              <p className="text-sm">Submit and track progress</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'communication',
      title: 'Direct Communication',
      description: 'Chat with government departments',
      icon: <MessageSquare className="h-8 w-8 text-primary" />,
      content: (
        <div className="space-y-4">
          <p>Communicate directly with government departments:</p>
          <div className="space-y-3">
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">Water & Sanitation</Badge>
                <Badge variant="default">Online</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Response time: 24-48 hours</p>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">Electricity</Badge>
                <Badge variant="default">Online</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Response time: 2-4 hours (emergency)</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'community',
      title: 'Community Engagement',
      description: 'Participate in community discussions and voting',
      icon: <Users className="h-8 w-8 text-primary" />,
      content: (
        <div className="space-y-4">
          <p>Engage with your community:</p>
          <div className="grid grid-cols-1 gap-3">
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="font-medium">Vote on Issues</span>
              </div>
              <p className="text-sm text-muted-foreground">Help prioritize community issues</p>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Join Discussions</span>
              </div>
              <p className="text-sm text-muted-foreground">Participate in community forums</p>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 text-purple-500" />
                <span className="font-medium">Track Progress</span>
              </div>
              <p className="text-sm text-muted-foreground">Monitor issue resolution</p>
            </div>
          </div>
        </div>
      )
    }
  ]

  if (!isOpen) return null

  const currentStepData = steps[currentStep]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0"
            onClick={completeOnboarding}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            {currentStepData.icon}
            <div>
              <CardTitle>{currentStepData.title}</CardTitle>
              <CardDescription>{currentStepData.description}</CardDescription>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded ${
                  index <= currentStep ? 'bg-primary' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStepData.content}
          
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            <div className="flex gap-2">
              <Button variant="ghost" onClick={completeOnboarding}>
                Skip Tutorial
              </Button>
              <Button onClick={nextStep}>
                {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                {currentStep < steps.length - 1 && <ArrowRight className="h-4 w-4 ml-2" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
