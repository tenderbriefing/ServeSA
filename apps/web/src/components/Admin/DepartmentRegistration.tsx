'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Alert, AlertDescription } from '@/components/ui/Alert'
import { 
  Building2, 
  Mail, 
  Phone, 
  Clock, 
  Users, 
  CheckCircle,
  Loader2,
  AlertTriangle
} from 'lucide-react'

interface DepartmentFormData {
  name: string
  description: string
  category: string
  contactEmail: string
  contactPhone: string
  operatingHours: string
  staffCount: number
  responseTime: string
  municipalityCode: string
  services: string[]
}

export function DepartmentRegistration() {
  const { user, isAdmin } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [formData, setFormData] = useState<DepartmentFormData>({
    name: '',
    description: '',
    category: '',
    contactEmail: '',
    contactPhone: '',
    operatingHours: 'Mon-Fri 8:00-17:00',
    staffCount: 0,
    responseTime: '24-48 hours',
    municipalityCode: '',
    services: []
  })
  const [newService, setNewService] = useState('')

  const categories = [
    { value: 'utilities', label: 'Utilities' },
    { value: 'infrastructure', label: 'Infrastructure' },
    { value: 'environment', label: 'Environment' },
    { value: 'community', label: 'Community Services' },
    { value: 'emergency', label: 'Emergency Services' },
    { value: 'health', label: 'Health Services' },
    { value: 'education', label: 'Education' },
    { value: 'transport', label: 'Transport' }
  ]

  const municipalities = [
    { code: 'JHB', name: 'Johannesburg' },
    { code: 'CPT', name: 'Cape Town' },
    { code: 'DBN', name: 'Durban' },
    { code: 'PTA', name: 'Pretoria' },
    { code: 'PE', name: 'Port Elizabeth' },
    { code: 'BFN', name: 'Bloemfontein' },
    { code: 'KIM', name: 'Kimberley' },
    { code: 'PLZ', name: 'Polokwane' }
  ]

  const handleInputChange = (field: keyof DepartmentFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addService = () => {
    if (newService.trim() && !formData.services.includes(newService.trim())) {
      setFormData(prev => ({
        ...prev,
        services: [...prev.services, newService.trim()]
      }))
      setNewService('')
    }
  }

  const removeService = (serviceToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter(service => service !== serviceToRemove)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !isAdmin) return

    setIsSubmitting(true)
    setMessage(null)

    try {
      await addDoc(collection(db, 'departments'), {
        ...formData,
        isOnline: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user.uid,
        status: 'pending_verification'
      })

      setMessage({ 
        type: 'success', 
        text: 'Department registration submitted successfully! It will be reviewed and activated soon.' 
      })
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        category: '',
        contactEmail: '',
        contactPhone: '',
        operatingHours: 'Mon-Fri 8:00-17:00',
        staffCount: 0,
        responseTime: '24-48 hours',
        municipalityCode: '',
        services: []
      })
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to register department' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Access Denied
          </CardTitle>
          <CardDescription>
            Only administrators can register new departments
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-500" />
          Register New Department
        </CardTitle>
        <CardDescription>
          Add a new government department to the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Department Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Water & Sanitation"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the department's responsibilities and services"
                rows={3}
                required
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    placeholder="contact@department.gov.za"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    placeholder="+27 11 123 4567"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Operational Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Operational Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="operatingHours">Operating Hours</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="operatingHours"
                    value={formData.operatingHours}
                    onChange={(e) => handleInputChange('operatingHours', e.target.value)}
                    placeholder="Mon-Fri 8:00-17:00"
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="staffCount">Staff Count</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="staffCount"
                    type="number"
                    value={formData.staffCount}
                    onChange={(e) => handleInputChange('staffCount', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="pl-10"
                    min="0"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="responseTime">Response Time</Label>
                <Input
                  id="responseTime"
                  value={formData.responseTime}
                  onChange={(e) => handleInputChange('responseTime', e.target.value)}
                  placeholder="24-48 hours"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="municipalityCode">Municipality *</Label>
              <Select value={formData.municipalityCode} onValueChange={(value) => handleInputChange('municipalityCode', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select municipality" />
                </SelectTrigger>
                <SelectContent>
                  {municipalities.map(municipality => (
                    <SelectItem key={municipality.code} value={municipality.code}>
                      {municipality.name} ({municipality.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Services Offered</h3>
            
            <div className="flex gap-2">
              <Input
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                placeholder="Add a service (e.g., Water supply)"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addService())}
              />
              <Button type="button" onClick={addService} variant="outline">
                Add
              </Button>
            </div>
            
            {formData.services.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.services.map((service, index) => (
                  <div key={index} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                    <span>{service}</span>
                    <button
                      type="button"
                      onClick={() => removeService(service)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {message && (
            <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            disabled={isSubmitting || !formData.name || !formData.category || !formData.contactEmail || !formData.municipalityCode}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Registering Department...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Register Department
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
