'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  MapPin, 
  Camera,
  Upload,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Send
} from 'lucide-react'
import Link from 'next/link'
import { AuthGate } from '@/components/Auth/AuthGate'

export default function ReportPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
    location: '',
    priority: 'medium',
    contactInfo: {
      name: '',
      email: '',
      phone: ''
    }
  })
  const [photos, setPhotos] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const categories = [
    { id: 'water-sewage', name: 'Water & Sewage', icon: '💧', sla: '24h' },
    { id: 'electricity', name: 'Electricity', icon: '⚡', sla: '4h' },
    { id: 'roads-infrastructure', name: 'Roads & Infrastructure', icon: '🛣️', sla: '72h' },
    { id: 'waste-management', name: 'Waste Management', icon: '🗑️', sla: '48h' },
    { id: 'digital-services', name: 'Digital Services', icon: '💻', sla: '168h' },
    { id: 'emergency-services', name: 'Emergency Services', icon: '🚨', sla: '1h' }
  ]

  const priorities = [
    { id: 'low', name: 'Low', description: 'Minor issue, no immediate impact' },
    { id: 'medium', name: 'Medium', description: 'Moderate impact on daily activities' },
    { id: 'high', name: 'High', description: 'Significant impact, urgent attention needed' }
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleContactChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        [field]: value
      }
    }))
  }

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setPhotos(prev => [...prev, ...files])
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      // Get current location if not provided
      let location = formData.location
      if (!location && navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 300000
            })
          })
          
          // Reverse geocode to get address
          const { georesolveAPI } = await import('@/lib/api/georesolve')
          const georesolveResult = await georesolveAPI.reverseGeocode(
            position.coords.latitude,
            position.coords.longitude
          )
          location = georesolveResult.address || `${position.coords.latitude}, ${position.coords.longitude}`
        } catch (geoError) {
          console.warn('Could not get current location:', geoError)
        }
      }

      // Create case data
      const caseData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        location: {
          lat: 0, // Will be resolved by backend
          lng: 0, // Will be resolved by backend
          address: location
        },
        contactInfo: formData.contactInfo,
        images: photos.map(file => URL.createObjectURL(file)), // Convert to URLs
        consent: true
      }

      // Submit case
      const { casesAPI } = await import('@/lib/api/cases')
      const result = await casesAPI.createCase(caseData)

      // Upload photos if any
      if (photos.length > 0) {
        try {
          await casesAPI.uploadMedia(result.caseId, photos)
        } catch (uploadError) {
          console.warn('Failed to upload photos:', uploadError)
          // Don't fail the entire submission for photo upload issues
        }
      }

      // Check for duplicates
      try {
        await casesAPI.checkDuplicates(result.caseId)
      } catch (duplicateError) {
        console.warn('Failed to check duplicates:', duplicateError)
        // Don't fail the entire submission for duplicate check issues
      }

      setIsSubmitting(false)
      setStep(4) // Success step
    } catch (error) {
      console.error('Error submitting case:', error)
      setIsSubmitting(false)
      // Show error message to user
      alert('Failed to submit case. Please try again.')
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.category && formData.title && formData.description
      case 2:
        return formData.location
      case 3:
        return formData.contactInfo.name && formData.contactInfo.email
      default:
        return false
    }
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">What type of issue are you reporting?</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleInputChange('category', category.id)}
              className={`p-4 border rounded-lg text-left transition-colors ${
                formData.category === category.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{category.icon}</span>
                <div>
                  <div className="font-medium">{category.name}</div>
                  <div className="text-sm text-gray-500">SLA: {category.sla}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Issue Title *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="Brief description of the issue"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Detailed Description *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Provide detailed information about the issue, including any relevant context..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Priority Level
        </label>
        <div className="space-y-2">
          {priorities.map((priority) => (
            <label key={priority.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="priority"
                value={priority.id}
                checked={formData.priority === priority.id}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="text-primary-600"
              />
              <div>
                <div className="font-medium">{priority.name}</div>
                <div className="text-sm text-gray-500">{priority.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Where is this issue located?</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address or Location Description *
            </label>
            <textarea
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Enter the full address or describe the location in detail..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800 mb-2">
              <MapPin className="w-4 h-4" />
              <span className="font-medium">Location Tips</span>
            </div>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Include street names and landmarks</li>
              <li>• Mention nearby businesses or buildings</li>
              <li>• Specify if it's on a specific side of the road</li>
              <li>• Add any relevant cross-streets</li>
            </ul>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Photos (Optional)
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 mb-2">
            Drag and drop photos here, or click to select files
          </p>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
            id="photo-upload"
          />
          <label htmlFor="photo-upload" className="cursor-pointer">
            <Button variant="outline" size="sm">
              <Camera className="w-4 h-4 mr-2" />
              Select Photos
            </Button>
          </label>
        </div>
        {photos.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">{photos.length} photo(s) selected</p>
            <div className="flex gap-2 overflow-x-auto">
              {photos.map((photo, index) => (
                <div key={index} className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-xs text-gray-500">{photo.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
        <p className="text-gray-600 mb-4">
          We'll use this information to keep you updated on your case progress.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.contactInfo.name}
              onChange={(e) => handleContactChange('name', e.target.value)}
              placeholder="Your full name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.contactInfo.email}
              onChange={(e) => handleContactChange('email', e.target.value)}
              placeholder="your.email@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              value={formData.contactInfo.phone}
              onChange={(e) => handleContactChange('phone', e.target.value)}
              placeholder="+27 12 345 6789"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="p-4 bg-yellow-50 rounded-lg">
        <div className="flex items-center gap-2 text-yellow-800 mb-2">
          <AlertTriangle className="w-4 h-4" />
          <span className="font-medium">Important</span>
        </div>
        <p className="text-sm text-yellow-700">
          By submitting this report, you agree to our terms of service and privacy policy. 
          Your contact information will only be used to provide updates on this case.
        </p>
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="text-center py-12">
      <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
      <h3 className="text-2xl font-bold text-gray-900 mb-2">Report Submitted Successfully!</h3>
      <p className="text-gray-600 mb-6">
        Your case has been created and assigned a reference number. We'll notify you of any updates.
      </p>
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Case Reference</p>
          <p className="text-lg font-mono font-bold text-gray-900">CASE-2024-{Math.floor(Math.random() * 1000).toString().padStart(3, '0')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard">
            <Button>
              View My Cases
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )

  return (
    <AuthGate>
      <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Report an Issue</h1>
          <p className="text-gray-600">Help improve your community by reporting service delivery issues</p>
        </div>

        {/* Progress Steps */}
        {step < 4 && (
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNumber
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {stepNumber}
                  </div>
                  {stepNumber < 3 && (
                    <div className={`w-16 h-1 mx-2 ${
                      step > stepNumber ? 'bg-primary-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span>Issue Details</span>
              <span>Location</span>
              <span>Contact Info</span>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-6">
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              {step === 4 && renderStep4()}

              {/* Navigation Buttons */}
              {step < 4 && (
                <div className="flex justify-between mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setStep(prev => Math.max(1, prev - 1))}
                    disabled={step === 1}
                  >
                    Previous
                  </Button>
                  
                  {step < 3 ? (
                    <Button
                      onClick={() => setStep(prev => prev + 1)}
                      disabled={!canProceed()}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={!canProceed() || isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Submit Report
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </AuthGate>
  )
}
