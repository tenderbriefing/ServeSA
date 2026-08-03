'use client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/Accordion'
import { Alert, AlertDescription } from '@/components/ui/Alert'
import { 
  BookOpen, 
  Play, 
  CheckCircle, 
  Clock, 
  Star, 
  Users, 
  Smartphone, 
  Globe, 
  Shield, 
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Home,
  FileText,
  Camera,
  MapPin,
  Bell,
  Settings
} from 'lucide-react'

interface Tutorial {
  id: string
  title: string
  description: string
  duration: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  category: string
  steps: TutorialStep[]
  completed: boolean
  progress: number
}

interface TutorialStep {
  id: string
  title: string
  description: string
  image?: string
  action?: string
  completed: boolean
}

interface HelpGuide {
  id: string
  title: string
  category: string
  content: string
  tags: string[]
  helpful: number
}

const tutorials: Tutorial[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Learn the basics of using the platform',
    duration: 5,
    difficulty: 'beginner',
    category: 'basics',
    progress: 0,
    completed: false,
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to ServeSA',
        description: 'Learn about the platform and its features',
        completed: false
      },
      {
        id: 'navigation',
        title: 'Navigation Basics',
        description: 'How to navigate through the app',
        completed: false
      },
      {
        id: 'account',
        title: 'Creating Your Account',
        description: 'Set up your profile and preferences',
        completed: false
      }
    ]
  },
  {
    id: 'reporting-issues',
    title: 'Reporting Issues',
    description: 'How to report service delivery issues',
    duration: 8,
    difficulty: 'beginner',
    category: 'reporting',
    progress: 0,
    completed: false,
    steps: [
      {
        id: 'identify',
        title: 'Identifying Issues',
        description: 'Learn to identify and categorize issues',
        completed: false
      },
      {
        id: 'photo-evidence',
        title: 'Adding Photo Evidence',
        description: 'How to take and upload photos',
        completed: false
      },
      {
        id: 'location',
        title: 'Setting Location',
        description: 'How to set the exact location of issues',
        completed: false
      },
      {
        id: 'submit',
        title: 'Submitting Reports',
        description: 'Final steps to submit your report',
        completed: false
      }
    ]
  },
  {
    id: 'community-engagement',
    title: 'Community Engagement',
    description: 'Participate in community discussions and voting',
    duration: 6,
    difficulty: 'intermediate',
    category: 'community',
    progress: 0,
    completed: false,
    steps: [
      {
        id: 'forums',
        title: 'Using Forums',
        description: 'How to participate in community discussions',
        completed: false
      },
      {
        id: 'voting',
        title: 'Voting on Issues',
        description: 'How to vote on reported issues',
        completed: false
      },
      {
        id: 'solutions',
        title: 'Proposing Solutions',
        description: 'How to suggest and vote on solutions',
        completed: false
      }
    ]
  },
  {
    id: 'advanced-features',
    title: 'Advanced Features',
    description: 'Master advanced platform features',
    duration: 10,
    difficulty: 'advanced',
    category: 'advanced',
    progress: 0,
    completed: false,
    steps: [
      {
        id: 'bulk-reporting',
        title: 'Bulk Reporting',
        description: 'Report multiple issues at once',
        completed: false
      },
      {
        id: 'anonymous-reporting',
        title: 'Anonymous Reporting',
        description: 'How to submit reports anonymously',
        completed: false
      },
      {
        id: 'evidence-collection',
        title: 'Enhanced Evidence Collection',
        description: 'Using AI-powered evidence collection',
        completed: false
      },
      {
        id: 'offline-mode',
        title: 'Offline Mode',
        description: 'Using the app without internet',
        completed: false
      }
    ]
  }
]

const helpGuides: HelpGuide[] = [
  {
    id: 'privacy-security',
    title: 'Privacy and Security',
    category: 'security',
    content: 'Learn about how we protect your data and maintain your privacy while using the platform.',
    tags: ['privacy', 'security', 'data protection'],
    helpful: 45
  },
  {
    id: 'accessibility',
    title: 'Accessibility Features',
    category: 'accessibility',
    content: 'Discover accessibility features like high contrast, large text, and screen reader support.',
    tags: ['accessibility', 'inclusive design', 'assistive technology'],
    helpful: 32
  },
  {
    id: 'multilingual',
    title: 'Multilingual Support',
    category: 'language',
    content: 'How to change languages and use the platform in your preferred language.',
    tags: ['language', 'translation', 'multilingual'],
    helpful: 28
  },
  {
    id: 'notifications',
    title: 'Managing Notifications',
    category: 'notifications',
    content: 'Configure your notification preferences for updates on your reports.',
    tags: ['notifications', 'alerts', 'updates'],
    helpful: 38
  }
]

export function DigitalLiteracyTraining() {
  const { t } = useTranslation()
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [tutorialsData, setTutorialsData] = useState<Tutorial[]>(tutorials)
  const [activeTab, setActiveTab] = useState('tutorials')

  const startTutorial = (tutorial: Tutorial) => {
    setSelectedTutorial(tutorial)
    setCurrentStep(0)
  }

  const completeStep = (stepId: string) => {
    if (!selectedTutorial) return

    const updatedTutorial = {
      ...selectedTutorial,
      steps: selectedTutorial.steps.map(step =>
        step.id === stepId ? { ...step, completed: true } : step
      )
    }

    // Calculate progress
    const completedSteps = updatedTutorial.steps.filter(step => step.completed).length
    const progress = (completedSteps / updatedTutorial.steps.length) * 100

    updatedTutorial.progress = progress
    updatedTutorial.completed = progress === 100

    setSelectedTutorial(updatedTutorial)
    setTutorialsData(prev => prev.map(t => t.id === selectedTutorial.id ? updatedTutorial : t))

    // Move to next step if not the last
    if (currentStep < selectedTutorial.steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const nextStep = () => {
    if (selectedTutorial && currentStep < selectedTutorial.steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'basics': return <Home className="h-4 w-4" />
      case 'reporting': return <FileText className="h-4 w-4" />
      case 'community': return <Users className="h-4 w-4" />
      case 'advanced': return <Star className="h-4 w-4" />
      default: return <BookOpen className="h-4 w-4" />
    }
  }

  const totalProgress = tutorialsData.reduce((acc, tutorial) => acc + tutorial.progress, 0) / tutorialsData.length

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">{t('digitalLiteracy.title')}</h1>
        </div>
        <p className="text-gray-600">{t('digitalLiteracy.description')}</p>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle>{t('digitalLiteracy.overallProgress')}</CardTitle>
          <CardDescription>{t('digitalLiteracy.progressDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t('digitalLiteracy.completion')}</span>
              <span className="text-sm text-gray-500">{Math.round(totalProgress)}%</span>
            </div>
            <Progress value={totalProgress} className="w-full" />
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{tutorialsData.filter(t => t.completed).length} {t('digitalLiteracy.completed')}</span>
              <span>{tutorialsData.length} {t('digitalLiteracy.total')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tutorials">{t('digitalLiteracy.tutorials')}</TabsTrigger>
          <TabsTrigger value="help">{t('digitalLiteracy.helpGuides')}</TabsTrigger>
        </TabsList>

        <TabsContent value="tutorials" className="space-y-6">
          {selectedTutorial ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedTutorial.title}</CardTitle>
                    <CardDescription>{selectedTutorial.description}</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedTutorial(null)}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t('digitalLiteracy.backToTutorials')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t('digitalLiteracy.progress')}</span>
                    <span className="text-sm text-gray-500">{Math.round(selectedTutorial.progress)}%</span>
                  </div>
                  <Progress value={selectedTutorial.progress} className="w-full" />
                </div>

                {/* Current Step */}
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">
                      {t('digitalLiteracy.step')} {currentStep + 1}: {selectedTutorial.steps[currentStep].title}
                    </h3>
                    <Badge className={selectedTutorial.steps[currentStep].completed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {selectedTutorial.steps[currentStep].completed ? t('digitalLiteracy.completed') : t('digitalLiteracy.pending')}
                    </Badge>
                  </div>
                  <p className="text-gray-600">{selectedTutorial.steps[currentStep].description}</p>
                  
                  {!selectedTutorial.steps[currentStep].completed && (
                    <Button onClick={() => completeStep(selectedTutorial.steps[currentStep].id)}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {t('digitalLiteracy.markComplete')}
                    </Button>
                  )}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t('digitalLiteracy.previous')}
                  </Button>
                  
                  <div className="flex items-center space-x-2">
                    {selectedTutorial.steps.map((step, index) => (
                      <div
                        key={step.id}
                        className={`w-3 h-3 rounded-full ${
                          index === currentStep ? 'bg-primary' :
                          step.completed ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>

                  <Button
                    onClick={nextStep}
                    disabled={currentStep === selectedTutorial.steps.length - 1}
                  >
                    {t('digitalLiteracy.next')}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tutorialsData.map((tutorial) => (
                <Card key={tutorial.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(tutorial.category)}
                        <div>
                          <CardTitle className="text-lg">{tutorial.title}</CardTitle>
                          <CardDescription>{tutorial.description}</CardDescription>
                        </div>
                      </div>
                      {tutorial.completed && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span>{tutorial.duration} {t('digitalLiteracy.minutes')}</span>
                        </div>
                        <Badge className={getDifficultyColor(tutorial.difficulty)}>
                          {tutorial.difficulty}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>{t('digitalLiteracy.progress')}</span>
                        <span>{Math.round(tutorial.progress)}%</span>
                      </div>
                      <Progress value={tutorial.progress} className="w-full" />
                    </div>

                    <Button 
                      onClick={() => startTutorial(tutorial)}
                      className="w-full"
                      variant={tutorial.completed ? "outline" : "default"}
                    >
                      {tutorial.completed ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {t('digitalLiteracy.review')}
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          {t('digitalLiteracy.start')}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="help" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {helpGuides.map((guide) => (
              <Card key={guide.id}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <HelpCircle className="h-5 w-5 text-primary" />
                    <span>{guide.title}</span>
                  </CardTitle>
                  <CardDescription>{guide.content}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {guide.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{guide.helpful} {t('digitalLiteracy.peopleFoundHelpful')}</span>
                    <Button variant="outline" size="sm">
                      {t('digitalLiteracy.readMore')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('digitalLiteracy.quickTips')}</CardTitle>
              <CardDescription>{t('digitalLiteracy.quickTipsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="tip-1">
                  <AccordionTrigger>{t('digitalLiteracy.tip1Title')}</AccordionTrigger>
                  <AccordionContent>
                    {t('digitalLiteracy.tip1Content')}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="tip-2">
                  <AccordionTrigger>{t('digitalLiteracy.tip2Title')}</AccordionTrigger>
                  <AccordionContent>
                    {t('digitalLiteracy.tip2Content')}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="tip-3">
                  <AccordionTrigger>{t('digitalLiteracy.tip3Title')}</AccordionTrigger>
                  <AccordionContent>
                    {t('digitalLiteracy.tip3Content')}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
