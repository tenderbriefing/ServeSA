'use client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Checkbox } from '@/components/ui/Checkbox'
import { Alert, AlertDescription } from '@/components/ui/Alert'
import { MapPin, Camera, Shield, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface AnonymousReport {
  title: string
  description: string
  category: string
  location: string
  photos: File[]
  priority: 'low' | 'medium' | 'high'
  isAnonymous: boolean
  contactEmail?: string
  contactPhone?: string
  allowFollowUp: boolean
  sensitiveIssue: boolean
  urgency: 'normal' | 'urgent' | 'emergency'
}

const categories = [
  'water', 'electricity', 'roads', 'sanitation', 'streetlights', 
  'parks', 'graffiti', 'noise', 'safety', 'corruption', 'other'
]

const priorities = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-800' }
]

const urgencyLevels = [
  { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-orange-100 text-orange-800' },
  { value: 'emergency', label: 'Emergency', color: 'bg-red-100 text-red-800' }
]

export function AnonymousReporting() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [report, setReport] = useState<AnonymousReport>({
    title: '',
    description: '',
    category: '',
    location: '',
    photos: [],
    priority: 'medium',
    isAnonymous: false,
    contactEmail: '',
    contactPhone: '',
    allowFollowUp: false,
    sensitiveIssue: false,
    urgency: 'normal'
  })
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showContactInfo, setShowContactInfo] = useState(false)

  const updateReport = (field: keyof AnonymousReport, value: any) => {
    setReport({ ...report, [field]: value })
  }

  const handlePhotoUpload = (files: FileList | null) => {
    if (!files) return
    const newPhotos = Array.from(files)
    updateReport('photos', [...report.photos, ...newPhotos])
  }

  const removePhoto = (photoIndex: number) => {
    const updatedPhotos = report.photos.filter((_, index) => index !== photoIndex)
    updateReport('photos', updatedPhotos)
  }

  const validateReport = () => {
    return report.title.trim() && 
           report.description.trim() && 
           report.category && 
           report.location.trim()
  }

  const handleSubmit = async () => {
    if (!validateReport()) return
    
    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Reset form after successful submission
      setReport({
        title: '',
        description: '',
        category: '',
        location: '',
        photos: [],
        priority: 'medium',
        isAnonymous: false,
        contactEmail: '',
        contactPhone: '',
        allowFollowUp: false,
        sensitiveIssue: false,
        urgency: 'normal'
      })
      setCurrentStep(1)
      setShowContactInfo(false)
    } catch (error) {
      console.error('Error submitting anonymous report:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getReportId = () => {
    // Generate a unique report ID for anonymous tracking
    return `ANON-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">{t('anonymousReporting.title')}</h1>
        </div>
        <p className="text-gray-600">{t('anonymousReporting.description')}</p>
      </div>

      {/* Privacy Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          {t('anonymousReporting.privacyNotice')}
        </AlertDescription>
      </Alert>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4">
        <div className={`flex items-center ${currentStep >= 1 ? 'text-primary' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
            1
          </div>
          <span className="ml-2">{t('anonymousReporting.step1')}</span>
        </div>
        <div className="w-8 h-1 bg-gray-200"></div>
        <div className={`flex items-center ${currentStep >= 2 ? 'text-primary' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
            2
          </div>
          <span className="ml-2">{t('anonymousReporting.step2')}</span>
        </div>
      </div>

      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('anonymousReporting.reportDetails')}</CardTitle>
            <CardDescription>{t('anonymousReporting.reportDetailsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('anonymousReporting.title')}</label>
                <Input
                  value={report.title}
                  onChange={(e) => updateReport('title', e.target.value)}
                  placeholder={t('anonymousReporting.titlePlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('anonymousReporting.category')}</label>
                <Select value={report.category} onValueChange={(value) => updateReport('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('anonymousReporting.selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {t(`categories.${category}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('anonymousReporting.description')}</label>
              <Textarea
                value={report.description}
                onChange={(e) => updateReport('description', e.target.value)}
                placeholder={t('anonymousReporting.descriptionPlaceholder')}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('anonymousReporting.location')}</label>
                <div className="relative">
                  <Input
                    value={report.location}
                    onChange={(e) => updateReport('location', e.target.value)}
                    placeholder={t('anonymousReporting.locationPlaceholder')}
                  />
                  <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('anonymousReporting.priority')}</label>
                <Select value={report.priority} onValueChange={(value) => updateReport('priority', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map(priority => (
                      <SelectItem key={priority.value} value={priority.value}>
                        <div className="flex items-center">
                          <Badge className={priority.color}>{priority.label}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('anonymousReporting.urgency')}</label>
              <Select value={report.urgency} onValueChange={(value) => updateReport('urgency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {urgencyLevels.map(urgency => (
                    <SelectItem key={urgency.value} value={urgency.value}>
                      <div className="flex items-center">
                        <Badge className={urgency.color}>{urgency.label}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('anonymousReporting.photos')}</label>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('photo-upload')?.click()}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {t('anonymousReporting.addPhotos')}
                </Button>
                <input
                  id="photo-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePhotoUpload(e.target.files)}
                />
              </div>
              {report.photos.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {report.photos.map((photo, photoIndex) => (
                    <div key={photoIndex} className="relative">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Photo ${photoIndex + 1}`}
                        className="w-16 h-16 object-cover rounded border"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute -top-1 -right-1 w-6 h-6 p-0 bg-red-500 text-white hover:bg-red-600"
                        onClick={() => removePhoto(photoIndex)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sensitive-issue"
                  checked={report.sensitiveIssue}
                  onCheckedChange={(checked: boolean) => updateReport('sensitiveIssue', checked)}
                />
                <label htmlFor="sensitive-issue" className="text-sm font-medium">
                  {t('anonymousReporting.sensitiveIssue')}
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="anonymous"
                  checked={report.isAnonymous}
                  onCheckedChange={(checked: boolean) => updateReport('isAnonymous', checked)}
                />
                <label htmlFor="anonymous" className="text-sm font-medium">
                  {t('anonymousReporting.submitAnonymously')}
                </label>
              </div>
            </div>

            <Button 
              onClick={() => setCurrentStep(2)} 
              className="w-full"
              disabled={!validateReport()}
            >
              {t('anonymousReporting.continue')}
            </Button>
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('anonymousReporting.privacySettings')}</CardTitle>
            <CardDescription>{t('anonymousReporting.privacySettingsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.isAnonymous ? (
              <div className="space-y-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    {t('anonymousReporting.anonymousMode')}
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="allow-followup"
                      checked={report.allowFollowUp}
                      onCheckedChange={(checked: boolean) => updateReport('allowFollowUp', checked)}
                    />
                    <label htmlFor="allow-followup" className="text-sm font-medium">
                      {t('anonymousReporting.allowFollowUp')}
                    </label>
                  </div>

                  {report.allowFollowUp && (
                    <div className="space-y-3 pl-6">
                      <div>
                        <label className="block text-sm font-medium mb-1">{t('anonymousReporting.contactEmail')}</label>
                        <Input
                          type="email"
                          value={report.contactEmail}
                          onChange={(e) => updateReport('contactEmail', e.target.value)}
                          placeholder={t('anonymousReporting.contactEmailPlaceholder')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">{t('anonymousReporting.contactPhone')}</label>
                        <Input
                          type="tel"
                          value={report.contactPhone}
                          onChange={(e) => updateReport('contactPhone', e.target.value)}
                          placeholder={t('anonymousReporting.contactPhonePlaceholder')}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">{t('anonymousReporting.reportId')}</h4>
                  <p className="text-sm text-gray-600 mb-2">{t('anonymousReporting.reportIdDesc')}</p>
                  <div className="flex items-center space-x-2">
                    <code className="bg-white px-2 py-1 rounded text-sm font-mono">
                      {getReportId()}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(getReportId())}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {t('anonymousReporting.identifiedMode')}
                  </AlertDescription>
                </Alert>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">{t('anonymousReporting.userInfo')}</h4>
                  <p className="text-sm text-gray-600">
                    {user?.email} • {user?.displayName}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">{t('anonymousReporting.reportSummary')}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{t('anonymousReporting.title')}:</span>
                    <span className="font-medium">{report.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('anonymousReporting.category')}:</span>
                    <span className="font-medium">{t(`categories.${report.category}`)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('anonymousReporting.location')}:</span>
                    <span className="font-medium">{report.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('anonymousReporting.photos')}:</span>
                    <span className="font-medium">{report.photos.length}</span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep(1)}
                  disabled={isSubmitting}
                >
                  {t('anonymousReporting.back')}
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{t('anonymousReporting.submitting')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4" />
                      <span>{t('anonymousReporting.submitReport')}</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
