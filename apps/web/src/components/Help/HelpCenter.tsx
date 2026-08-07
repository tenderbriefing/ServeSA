'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/Accordion'
import { Badge } from '@/components/ui/Badge'
import { 
  HelpCircle, 
  Search, 
  BookOpen, 
  MessageCircle, 
  Phone, 
  Mail,
  FileText,
  Video,
  Download,
  ExternalLink,
  ChevronRight
} from 'lucide-react'

interface HelpSection {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  articles: HelpArticle[]
}

interface HelpArticle {
  id: string
  title: string
  content: string
  tags: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  lastUpdated: string
}

const helpSections: HelpSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Learn the basics of using Serve SA',
    icon: <BookOpen className="h-5 w-5 text-primary-600" />,
    articles: [
      {
        id: 'create-account',
        title: 'How to Create an Account',
        content: 'Creating an account on Serve SA is simple and free. Click the "Sign Up" button, enter your email address, create a password, and verify your email. You can also sign up using your Google account for faster registration.',
        tags: ['account', 'registration', 'signup'],
        difficulty: 'beginner',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'first-report',
        title: 'Submitting Your First Report',
        content: 'To submit a service delivery issue: 1) Click "Report Issue" on the homepage, 2) Take photos or videos of the problem, 3) Add location details, 4) Select the appropriate category, 5) Provide a description, and 6) Submit your report. You\'ll receive a tracking number to monitor progress.',
        tags: ['reporting', 'first-time', 'tutorial'],
        difficulty: 'beginner',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'tracking-reports',
        title: 'Tracking Your Reports',
        content: 'All your submitted reports can be tracked in your dashboard. You\'ll see the current status, any updates from departments, and estimated resolution times. You can also receive email notifications when there are updates.',
        tags: ['tracking', 'dashboard', 'status'],
        difficulty: 'beginner',
        lastUpdated: '2024-01-15'
      }
    ]
  },
  {
    id: 'reporting',
    title: 'Reporting Issues',
    description: 'Everything about reporting service delivery problems',
    icon: <FileText className="h-5 w-5 text-green-600" />,
    articles: [
      {
        id: 'report-categories',
        title: 'Understanding Report Categories',
        content: 'Serve SA organises reports into categories: Water & Sewage, Electricity, Roads & Infrastructure, Waste Management, Digital Services, and Emergency Services. Choose the most appropriate category to ensure your report reaches the right department quickly.',
        tags: ['categories', 'departments', 'routing'],
        difficulty: 'beginner',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'photo-guidelines',
        title: 'Photo and Video Guidelines',
        content: 'Good photos help departments understand and prioritise issues. Take clear, well-lit photos from multiple angles. Include landmarks or street signs for location context. Videos should be short (under 2 minutes) and show the problem clearly.',
        tags: ['photos', 'videos', 'evidence'],
        difficulty: 'intermediate',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'anonymous-reporting',
        title: 'Anonymous Reporting',
        content: 'You can submit reports anonymously if you prefer not to share your identity. Anonymous reports are still processed but you won\'t receive direct updates. You can track progress using the report ID provided after submission.',
        tags: ['anonymous', 'privacy', 'security'],
        difficulty: 'beginner',
        lastUpdated: '2024-01-15'
      }
    ]
  },
  {
    id: 'communication',
    title: 'Communication',
    description: 'How to communicate with departments and community',
    icon: <MessageCircle className="h-5 w-5 text-primary-600" />,
    articles: [
      {
        id: 'messaging-departments',
        title: 'Messaging Government Departments',
        content: 'You can chat directly with government departments through the messaging system. Find the department you need to contact, start a conversation, and get real-time responses. Response times vary by department and issue urgency.',
        tags: ['messaging', 'departments', 'chat'],
        difficulty: 'beginner',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'community-forums',
        title: 'Participating in Community Forums',
        content: 'Join community discussions about local issues. You can start new topics, reply to existing discussions, and connect with neighbours. Forums are moderated to ensure respectful communication.',
        tags: ['forums', 'community', 'discussions'],
        difficulty: 'beginner',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'voting-system',
        title: 'Voting on Community Issues',
        content: 'Help prioritise community issues by voting on reported problems. Upvote issues that affect you or your neighbourhood. This helps departments understand which issues are most important to the community.',
        tags: ['voting', 'prioritization', 'community'],
        difficulty: 'beginner',
        lastUpdated: '2024-01-15'
      }
    ]
  },
  {
    id: 'account-settings',
    title: 'Account & Settings',
    description: 'Managing your account and preferences',
    icon: <HelpCircle className="h-5 w-5 text-gold-600" />,
    articles: [
      {
        id: 'profile-settings',
        title: 'Updating Your Profile',
        content: 'Keep your profile information up to date. You can change your display name, email address, phone number, and municipality. This helps departments contact you when needed and ensures you receive relevant local updates.',
        tags: ['profile', 'settings', 'personal-info'],
        difficulty: 'beginner',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'notification-preferences',
        title: 'Notification Preferences',
        content: 'Customize how you receive notifications. Choose between email, in-app notifications, or both. You can set preferences for different types of updates: report status changes, messages from departments, community activity, and system announcements.',
        tags: ['notifications', 'preferences', 'settings'],
        difficulty: 'intermediate',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'privacy-settings',
        title: 'Privacy and Security',
        content: 'Your privacy is important to us. You can control what information is visible to other users, choose to report anonymously, and manage your data sharing preferences. All personal information is protected according to South African privacy laws.',
        tags: ['privacy', 'security', 'data-protection'],
        difficulty: 'intermediate',
        lastUpdated: '2024-01-15'
      }
    ]
  }
]

export function HelpCenter() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null)

  const filteredSections = helpSections.map(section => ({
    ...section,
    articles: section.articles.filter(article =>
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  })).filter(section => section.articles.length > 0)

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-success-tint text-success'
      case 'intermediate':
        return 'bg-warning-tint text-warning'
      case 'advanced':
        return 'bg-danger-tint text-danger'
      default:
        return 'bg-surface-muted text-ink'
    }
  }

  const selectedArticleData = helpSections
    .flatMap(section => section.articles)
    .find(article => article.id === selectedArticle)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Help Center</h1>
        <p className="text-muted-foreground">
          Find answers to common questions and learn how to use Serve SA effectively
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search and Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Help
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  placeholder="Search help articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                
                <div className="space-y-2">
                  <h3 className="font-semibold">Browse by Category</h3>
                  {helpSections.map((section) => (
                    <Button
                      key={section.id}
                      variant={selectedSection === section.id ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setSelectedSection(selectedSection === section.id ? null : section.id)}
                    >
                      {section.icon}
                      <span className="ml-2">{section.title}</span>
                      <ChevronRight className={`h-4 w-4 ml-auto transition-transform ${
                        selectedSection === section.id ? 'rotate-90' : ''
                      }`} />
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Support */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Need More Help?</CardTitle>
              <CardDescription>
                Can&apos;t find what you&apos;re looking for? Contact our support team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Email Support
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Phone className="h-4 w-4 mr-2" />
                Call Support
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <MessageCircle className="h-4 w-4 mr-2" />
                Live Chat
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-2">
          {selectedArticleData ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedArticleData.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getDifficultyColor(selectedArticleData.difficulty)}>
                        {selectedArticleData.difficulty}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Updated {selectedArticleData.lastUpdated}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedArticle(null)}
                  >
                    Back to List
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-ink leading-relaxed">
                    {selectedArticleData.content}
                  </p>
                </div>
                
                <div className="mt-6 pt-4 border-t">
                  <h4 className="font-semibold mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedArticleData.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredSections.map((section) => (
                <Card key={section.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {section.icon}
                      {section.title}
                    </CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {section.articles.map((article) => (
                        <div
                          key={article.id}
                          className="p-4 border rounded-lg hover:bg-surface-muted cursor-pointer transition-colors"
                          onClick={() => setSelectedArticle(article.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium">{article.title}</h3>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {article.content}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getDifficultyColor(article.difficulty)}>
                                {article.difficulty}
                              </Badge>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
