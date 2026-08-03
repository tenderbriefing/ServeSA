'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  Shield, 
  Users, 
  MessageSquare, 
  Heart, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Flag,
  Eye,
  Lock
} from 'lucide-react'

export function CommunityGuidelines() {
  const guidelines = [
    {
      id: 'respect',
      title: 'Be Respectful',
      description: 'Treat all community members with dignity and respect, regardless of their background, beliefs, or opinions.',
      icon: <Heart className="h-5 w-5 text-red-500" />,
      examples: [
        'Use polite and constructive language',
        'Listen to different perspectives',
        'Avoid personal attacks or insults',
        'Be patient with newcomers'
      ],
      violations: [
        'Harassment or bullying',
        'Discriminatory language',
        'Threats or intimidation',
        'Personal attacks'
      ]
    },
    {
      id: 'constructive',
      title: 'Be Constructive',
      description: 'Focus on solutions and positive contributions to improve service delivery in your community.',
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      examples: [
        'Provide helpful information',
        'Suggest practical solutions',
        'Share relevant experiences',
        'Ask thoughtful questions'
      ],
      violations: [
        'Spam or irrelevant content',
        'Trolling or disruptive behavior',
        'False or misleading information',
        'Excessive complaining without solutions'
      ]
    },
    {
      id: 'accurate',
      title: 'Be Accurate',
      description: 'Share truthful information and verify facts before posting. Misinformation can harm community trust.',
      icon: <Shield className="h-5 w-5 text-blue-500" />,
      examples: [
        'Verify information before sharing',
        'Cite sources when possible',
        'Correct mistakes promptly',
        'Distinguish between facts and opinions'
      ],
      violations: [
        'Spreading false information',
        'Manipulated photos or videos',
        'Misleading claims',
        'Unverified rumors'
      ]
    },
    {
      id: 'relevant',
      title: 'Stay Relevant',
      description: 'Keep discussions focused on service delivery, community issues, and local governance topics.',
      icon: <MessageSquare className="h-5 w-5 text-purple-500" />,
      examples: [
        'Discuss local service issues',
        'Share community updates',
        'Provide feedback on services',
        'Connect with neighbors'
      ],
      violations: [
        'Off-topic discussions',
        'Political campaigning',
        'Commercial advertising',
        'Personal matters unrelated to services'
      ]
    },
    {
      id: 'privacy',
      title: 'Respect Privacy',
      description: 'Protect personal information and respect others\' privacy. Don\'t share private details without permission.',
      icon: <Lock className="h-5 w-5 text-orange-500" />,
      examples: [
        'Don\'t share personal contact details',
        'Respect others\' anonymity',
        'Ask permission before sharing photos',
        'Report privacy violations'
      ],
      violations: [
        'Sharing personal information',
        'Doxxing or revealing identities',
        'Unauthorized photo sharing',
        'Stalking or following users'
      ]
    }
  ]

  const moderationActions = [
    {
      action: 'Warning',
      description: 'First-time minor violations receive a warning with guidance on proper behavior.',
      icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />
    },
    {
      action: 'Content Removal',
      description: 'Inappropriate content is removed and the user is notified of the violation.',
      icon: <XCircle className="h-4 w-4 text-red-500" />
    },
    {
      action: 'Temporary Restriction',
      description: 'Repeated violations may result in temporary posting restrictions (1-7 days).',
      icon: <Eye className="h-4 w-4 text-orange-500" />
    },
    {
      action: 'Account Suspension',
      description: 'Serious or repeated violations may result in account suspension or permanent ban.',
      icon: <Lock className="h-4 w-4 text-red-600" />
    }
  ]

  const reportingProcess = [
    {
      step: 1,
      title: 'Identify Violation',
      description: 'Recognize content or behavior that violates community guidelines.'
    },
    {
      step: 2,
      title: 'Report Content',
      description: 'Use the report button or flag inappropriate content for review.'
    },
    {
      step: 3,
      title: 'Moderator Review',
      description: 'Our moderation team reviews the report within 24 hours.'
    },
    {
      step: 4,
      title: 'Action Taken',
      description: 'Appropriate action is taken and all parties are notified of the outcome.'
    }
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Community Guidelines</h1>
        <p className="text-muted-foreground">
          Help us maintain a positive, constructive environment for all community members
        </p>
      </div>

      <div className="space-y-8">
        {/* Introduction */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Our Community Values
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed mb-4">
              ServeSA is a platform for active citizens to improve service delivery in their communities. 
              We believe in the power of constructive dialogue, mutual respect, and collaborative problem-solving. 
              These guidelines help ensure our community remains a safe, welcoming space for everyone.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <Heart className="h-8 w-8 mx-auto mb-2 text-red-500" />
                <h3 className="font-semibold">Respectful</h3>
                <p className="text-sm text-muted-foreground">Treat everyone with dignity</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <h3 className="font-semibold">Constructive</h3>
                <p className="text-sm text-muted-foreground">Focus on solutions</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Shield className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <h3 className="font-semibold">Trustworthy</h3>
                <p className="text-sm text-muted-foreground">Share accurate information</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Guidelines */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Community Guidelines</h2>
          {guidelines.map((guideline) => (
            <Card key={guideline.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {guideline.icon}
                  {guideline.title}
                </CardTitle>
                <CardDescription>{guideline.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Good Examples
                    </h4>
                    <ul className="space-y-1">
                      {guideline.examples.map((example, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-green-500 mt-1">•</span>
                          {example}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      Violations
                    </h4>
                    <ul className="space-y-1">
                      {guideline.violations.map((violation, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-red-500 mt-1">•</span>
                          {violation}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Moderation Process */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              Moderation Process
            </CardTitle>
            <CardDescription>
              How we handle violations and maintain community standards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Moderation Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {moderationActions.map((action, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      {action.icon}
                      <div>
                        <h4 className="font-medium">{action.action}</h4>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Reporting Process</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {reportingProcess.map((step) => (
                    <div key={step.step} className="text-center">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2 font-semibold">
                        {step.step}
                      </div>
                      <h4 className="font-medium text-sm">{step.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact and Appeals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-orange-500" />
              Appeals and Contact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Appeal a Decision</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  If you believe a moderation decision was unfair, you can appeal within 7 days.
                </p>
                <Button variant="outline" size="sm">
                  Submit Appeal
                </Button>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Contact Moderators</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Have questions about the guidelines or need clarification? Contact our moderation team.
                </p>
                <Button variant="outline" size="sm">
                  Contact Support
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agreement */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900">Agreement</h3>
                <p className="text-sm text-blue-800 mt-1">
                  By using ServeSA, you agree to follow these community guidelines. 
                  Violations may result in content removal, account restrictions, or suspension. 
                  We reserve the right to update these guidelines as needed to maintain a positive community environment.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
