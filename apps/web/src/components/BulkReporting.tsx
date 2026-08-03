'use client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Plus, Trash2, MapPin, Camera, Upload, CheckCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface BulkIssue {
  id: string
  title: string
  description: string
  category: string
  location: string
  photos: File[]
  priority: 'low' | 'medium' | 'high'
}

const categories = [
  'water', 'electricity', 'roads', 'sanitation', 'streetlights', 
  'parks', 'graffiti', 'noise', 'safety', 'other'
]

const priorities = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-800' }
]

export function BulkReporting() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [issues, setIssues] = useState<BulkIssue[]>([])
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedCount, setSubmittedCount] = useState(0)

  const addIssue = () => {
    const newIssue: BulkIssue = {
      id: Date.now().toString(),
      title: '',
      description: '',
      category: '',
      location: '',
      photos: [],
      priority: 'medium'
    }
    setIssues([...issues, newIssue])
  }

  const removeIssue = (id: string) => {
    setIssues(issues.filter(issue => issue.id !== id))
  }

  const updateIssue = (id: string, field: keyof BulkIssue, value: any) => {
    setIssues(issues.map(issue => 
      issue.id === id ? { ...issue, [field]: value } : issue
    ))
  }

  const handlePhotoUpload = (issueId: string, files: FileList | null) => {
    if (!files) return
    const newPhotos = Array.from(files)
    updateIssue(issueId, 'photos', [...issues.find(i => i.id === issueId)?.photos || [], ...newPhotos])
  }

  const removePhoto = (issueId: string, photoIndex: number) => {
    const issue = issues.find(i => i.id === issueId)
    if (!issue) return
    const updatedPhotos = issue.photos.filter((_, index) => index !== photoIndex)
    updateIssue(issueId, 'photos', updatedPhotos)
  }

  const validateIssues = () => {
    return issues.every(issue => 
      issue.title.trim() && 
      issue.description.trim() && 
      issue.category && 
      issue.location.trim()
    )
  }

  const handleSubmit = async () => {
    if (!validateIssues()) return
    
    setIsSubmitting(true)
    setSubmittedCount(0)

    try {
      for (const issue of issues) {
        // Simulate API call for each issue
        await new Promise(resolve => setTimeout(resolve, 500))
        setSubmittedCount(prev => prev + 1)
      }
      
      // Reset form after successful submission
      setIssues([])
      setCurrentStep(1)
      setSubmittedCount(0)
    } catch (error) {
      console.error('Error submitting bulk issues:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const progress = (submittedCount / issues.length) * 100

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">{t('bulkReporting.title')}</h1>
        <p className="text-gray-600">{t('bulkReporting.description')}</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4">
        <div className={`flex items-center ${currentStep >= 1 ? 'text-primary' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
            1
          </div>
          <span className="ml-2">{t('bulkReporting.step1')}</span>
        </div>
        <div className="w-8 h-1 bg-gray-200"></div>
        <div className={`flex items-center ${currentStep >= 2 ? 'text-primary' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
            2
          </div>
          <span className="ml-2">{t('bulkReporting.step2')}</span>
        </div>
      </div>

      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('bulkReporting.addIssues')}</CardTitle>
            <CardDescription>{t('bulkReporting.addIssuesDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {issues.map((issue, index) => (
              <div key={issue.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{t('bulkReporting.issue')} #{index + 1}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeIssue(issue.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('bulkReporting.title')}</label>
                    <Input
                      value={issue.title}
                      onChange={(e) => updateIssue(issue.id, 'title', e.target.value)}
                      placeholder={t('bulkReporting.titlePlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('bulkReporting.category')}</label>
                    <Select value={issue.category} onValueChange={(value) => updateIssue(issue.id, 'category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('bulkReporting.selectCategory')} />
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
                  <label className="block text-sm font-medium mb-1">{t('bulkReporting.description')}</label>
                  <Textarea
                    value={issue.description}
                    onChange={(e) => updateIssue(issue.id, 'description', e.target.value)}
                    placeholder={t('bulkReporting.descriptionPlaceholder')}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('bulkReporting.location')}</label>
                    <div className="relative">
                      <Input
                        value={issue.location}
                        onChange={(e) => updateIssue(issue.id, 'location', e.target.value)}
                        placeholder={t('bulkReporting.locationPlaceholder')}
                      />
                      <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('bulkReporting.priority')}</label>
                    <Select value={issue.priority} onValueChange={(value) => updateIssue(issue.id, 'priority', value)}>
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
                  <label className="block text-sm font-medium mb-2">{t('bulkReporting.photos')}</label>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById(`photo-upload-${issue.id}`)?.click()}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      {t('bulkReporting.addPhotos')}
                    </Button>
                    <input
                      id={`photo-upload-${issue.id}`}
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePhotoUpload(issue.id, e.target.files)}
                    />
                  </div>
                  {issue.photos.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {issue.photos.map((photo, photoIndex) => (
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
                            onClick={() => removePhoto(issue.id, photoIndex)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            <Button onClick={addIssue} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              {t('bulkReporting.addAnotherIssue')}
            </Button>

            {issues.length > 0 && (
              <Button 
                onClick={() => setCurrentStep(2)} 
                className="w-full"
                disabled={!validateIssues()}
              >
                {t('bulkReporting.continue')} ({issues.length} {t('bulkReporting.issues')})
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('bulkReporting.reviewAndSubmit')}</CardTitle>
            <CardDescription>{t('bulkReporting.reviewDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isSubmitting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{t('bulkReporting.submitting')}</span>
                  <span>{submittedCount}/{issues.length}</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            <div className="space-y-4">
              {issues.map((issue, index) => (
                <div key={issue.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{issue.title}</h3>
                      <p className="text-gray-600 text-sm mt-1">{issue.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>{t(`categories.${issue.category}`)}</span>
                        <span>•</span>
                        <span>{issue.location}</span>
                        <span>•</span>
                        <Badge className={priorities.find(p => p.value === issue.priority)?.color}>
                          {priorities.find(p => p.value === issue.priority)?.label}
                        </Badge>
                      </div>
                      {issue.photos.length > 0 && (
                        <div className="mt-2">
                          <span className="text-sm text-gray-500">{issue.photos.length} {t('bulkReporting.photos')}</span>
                        </div>
                      )}
                    </div>
                    {isSubmitting && submittedCount > index && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex space-x-4">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(1)}
                disabled={isSubmitting}
              >
                {t('bulkReporting.back')}
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? t('bulkReporting.submitting') : t('bulkReporting.submitAll')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
