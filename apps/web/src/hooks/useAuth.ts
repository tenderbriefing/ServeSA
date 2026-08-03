import { useState, useEffect } from 'react'
import { auth } from '@/lib/firebase'
import { User, onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { UserProfile } from '@/types/auth'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid)
          const userDoc = await getDoc(userDocRef)
          
          if (userDoc.exists()) {
            const userData = userDoc.data()
            setUserProfile({
              uid: user.uid,
              email: userData.email || user.email || '',
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              phone: userData.phone,
              userType: userData.userType || 'citizen',
              province: userData.province,
              municipalityCode: userData.municipalityCode,
              createdAt: userData.createdAt?.toDate() || new Date(),
              updatedAt: userData.updatedAt?.toDate() || new Date(),
            })
          } else {
            // This is a new user (likely from Google Auth), create a basic profile
            const isNewUser = user.metadata.creationTime === user.metadata.lastSignInTime
            
            if (isNewUser) {
              const displayName = user.displayName || ''
              const [firstName, ...lastNameParts] = displayName.split(' ')
              const lastName = lastNameParts.join(' ') || ''
              
              const newUserProfile: UserProfile = {
                uid: user.uid,
                email: user.email || '',
                firstName: firstName,
                lastName: lastName,
                userType: 'citizen',
                createdAt: new Date(),
                updatedAt: new Date(),
              }
              
              // Save the basic profile to Firestore
              await setDoc(userDocRef, newUserProfile)
              setUserProfile(newUserProfile)
              
              console.log('Created new user profile for Google user:', user.email)
            }
          }
        } catch (error) {
          console.error('Error fetching user profile:', error)
        }
      } else {
        setUserProfile(null)
      }
      
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return {
    user,
    userProfile,
    loading,
    isAuthenticated: !!user,
    isOfficial: userProfile?.userType === 'department',
    isAdmin: userProfile?.userType === 'admin',
  }
}