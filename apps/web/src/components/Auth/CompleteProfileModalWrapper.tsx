'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { CompleteProfileModal } from './CompleteProfileModal'

export function CompleteProfileModalWrapper() {
  const { user, userProfile, loading } = useAuth()
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (!loading && user && userProfile) {
      // Check if this is a Google user who needs to complete their profile
      const isGoogleUser = user.providerData.some(provider => provider.providerId === 'google.com')
      const needsProfileCompletion = isGoogleUser && (!userProfile.province || !userProfile.municipalityCode)
      
      if (needsProfileCompletion) {
        setShowModal(true)
      }
    }
  }, [user, userProfile, loading])

  const handleClose = () => {
    setShowModal(false)
  }

  return (
    <CompleteProfileModal 
      isOpen={showModal} 
      onClose={handleClose} 
    />
  )
}
