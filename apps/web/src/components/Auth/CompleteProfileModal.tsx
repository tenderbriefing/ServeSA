'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Alert, AlertDescription } from '@/components/ui/Alert'
import { MapPin, Phone, User, AlertCircle, CheckCircle } from 'lucide-react'
import { southAfricaProvinces, getMunicipalitiesByProvince, type Municipality } from '@/lib/southAfricaData'

interface CompleteProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CompleteProfileModal({ isOpen, onClose }: CompleteProfileModalProps) {
  const { user, userProfile } = useAuth()
  const [formData, setFormData] = useState({
    phone: userProfile?.phone || '',
    province: userProfile?.province || '',
    municipalityCode: userProfile?.municipalityCode || ''
  })
  const [availableMunicipalities, setAvailableMunicipalities] = useState<Municipality[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // When province changes, update available municipalities and reset municipality selection
    if (field === 'province') {
      const municipalities = getMunicipalitiesByProvince(value)
      setAvailableMunicipalities(municipalities)
      setFormData(prev => ({ ...prev, municipalityCode: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSubmitting(true)
    setError('')

    try {
      const userDocRef = doc(db, 'users', user.uid)
      await updateDoc(userDocRef, {
        phone: formData.phone,
        province: formData.province,
        municipalityCode: formData.municipalityCode,
        updatedAt: new Date()
      })

      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold">Complete Your Profile</CardTitle>
          <CardDescription>
            Add optional contact and location details. You can skip this and
            still report issues.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center py-6">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-700 mb-2">Profile Updated!</h3>
              <p className="text-ink-muted">Your profile has been successfully updated.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Mobile number <span className="text-ink-subtle">(optional)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ink-subtle" />
                  <Input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="082 123 4567"
                    className="pl-10 min-h-touch"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Province <span className="text-ink-subtle">(optional)</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ink-subtle" />
                  <Select value={formData.province} onValueChange={(value) => handleInputChange('province', value)}>
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder="Select your province" />
                    </SelectTrigger>
                    <SelectContent>
                      {southAfricaProvinces.map((province) => (
                        <SelectItem key={province.code} value={province.code}>
                          {province.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Municipality <span className="text-ink-subtle">(optional)</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ink-subtle" />
                  <Select 
                    value={formData.municipalityCode} 
                    onValueChange={(value) => handleInputChange('municipalityCode', value)}
                    disabled={!formData.province}
                  >
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder={formData.province ? "Select your municipality" : "Select province first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMunicipalities.map((municipality) => (
                        <SelectItem key={municipality.code} value={municipality.code}>
                          {municipality.name} ({municipality.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Skip for Now
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving…' : 'Save profile'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
