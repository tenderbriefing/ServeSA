import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updatePassword,
  updateEmail,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth'
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { auth, db, collections } from './firebase'
import { User, UserSchema, UserRole } from '@/types'

const googleProvider = new GoogleAuthProvider()
googleProvider.addScope('email')
googleProvider.addScope('profile')

// Sign in with Google
export const signInWithGoogle = async (): Promise<User> => {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    const user = result.user
    
    // Check if user exists in Firestore
    const userDoc = await getDoc(doc(db, collections.users, user.uid))
    
    if (!userDoc.exists()) {
      // Create new user profile
      const newUser: Omit<User, 'uid'> = {
        email: user.email || undefined,
        phone: user.phoneNumber || undefined,
        displayName: user.displayName || undefined,
        photoURL: user.photoURL || undefined,
        roles: ['citizen'],
        contactPreferences: ['email'],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActiveAt: new Date(),
        consent: {
          dataCollection: false,
          notifications: false,
          location: false,
          media: false,
        },
      }
      
      await setDoc(doc(db, collections.users, user.uid), {
        ...newUser,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      
      return { uid: user.uid, ...newUser }
    } else {
      // Update last active
      await updateDoc(doc(db, collections.users, user.uid), {
        lastActiveAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      
      return { uid: user.uid, ...userDoc.data() } as User
    }
  } catch (error) {
    console.error('Error signing in with Google:', error)
    throw error
  }
}

// Sign up with email and password
export const signUpWithEmail = async (
  email: string, 
  password: string, 
  userData: {
    displayName: string;
    municipalityCode: string;
    phone?: string;
  }
): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    
    // Update Firebase Auth profile
    await updateProfile(user, {
      displayName: userData.displayName
    })
    
    // Send email verification
    await sendEmailVerification(user)
    
    // Create user profile in Firestore
    const newUser: User = {
      uid: user.uid,
      email: user.email || undefined,
      displayName: userData.displayName,
      phone: userData.phone,
      municipalityCode: userData.municipalityCode,
      roles: ['citizen'],
      contactPreferences: ['email'],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActiveAt: new Date(),
      consent: {
        dataCollection: false,
        notifications: false,
        location: false,
        media: false,
      },
    }

    await setDoc(doc(db, collections.users, user.uid), {
      ...newUser,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
    })

    return newUser
  } catch (error: any) {
    console.error('Error signing up with email:', error)
    
    // Provide user-friendly error messages
    switch (error.code) {
      case 'auth/email-already-in-use':
        throw new Error('An account with this email already exists.')
      case 'auth/invalid-email':
        throw new Error('Please enter a valid email address.')
      case 'auth/weak-password':
        throw new Error('Password should be at least 6 characters long.')
      case 'auth/operation-not-allowed':
        throw new Error('Email/password accounts are not enabled.')
      default:
        throw new Error('Failed to create account. Please try again.')
    }
  }
}

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    
    // Update user profile in Firestore
    await updateUserProfile(user.uid, {
      lastActiveAt: new Date(),
    })

    const profile = await getUserProfile(user.uid)
    if (profile) return profile

    return {
      uid: user.uid,
      email: user.email || undefined,
      displayName: user.displayName || undefined,
      photoURL: user.photoURL || undefined,
      roles: ['citizen'],
      contactPreferences: ['email'],
      createdAt: new Date(),
      updatedAt: new Date(),
      consent: {
        dataCollection: false,
        notifications: false,
        location: false,
        media: false,
      },
    }
  } catch (error: any) {
    console.error('Error signing in with email:', error)
    
    // Provide user-friendly error messages
    switch (error.code) {
      case 'auth/user-not-found':
        throw new Error('No account found with this email address.')
      case 'auth/wrong-password':
        throw new Error('Incorrect password. Please try again.')
      case 'auth/invalid-email':
        throw new Error('Please enter a valid email address.')
      case 'auth/user-disabled':
        throw new Error('This account has been disabled. Please contact support.')
      case 'auth/too-many-requests':
        throw new Error('Too many failed attempts. Please try again later.')
      default:
        throw new Error('Failed to sign in. Please check your credentials and try again.')
    }
  }
}

// Send password reset email
export const sendPasswordReset = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email)
  } catch (error: any) {
    console.error('Error sending password reset:', error)
    
    switch (error.code) {
      case 'auth/user-not-found':
        throw new Error('No account found with this email address.')
      case 'auth/invalid-email':
        throw new Error('Please enter a valid email address.')
      case 'auth/too-many-requests':
        throw new Error('Too many requests. Please try again later.')
      default:
        throw new Error('Failed to send password reset email. Please try again.')
    }
  }
}

// Update user password
export const updateUserPassword = async (newPassword: string): Promise<void> => {
  try {
    const user = auth.currentUser
    if (!user) {
      throw new Error('No user is currently signed in.')
    }
    
    await updatePassword(user, newPassword)
  } catch (error: any) {
    console.error('Error updating password:', error)
    
    switch (error.code) {
      case 'auth/weak-password':
        throw new Error('Password should be at least 6 characters long.')
      case 'auth/requires-recent-login':
        throw new Error('Please sign in again before changing your password.')
      default:
        throw new Error('Failed to update password. Please try again.')
    }
  }
}

// Update user email
export const updateUserEmail = async (newEmail: string): Promise<void> => {
  try {
    const user = auth.currentUser
    if (!user) {
      throw new Error('No user is currently signed in.')
    }
    
    await updateEmail(user, newEmail)
    await sendEmailVerification(user)
    
    // Update Firestore profile
    await updateUserProfile(user.uid, {
      email: newEmail,
    })
  } catch (error: any) {
    console.error('Error updating email:', error)
    
    switch (error.code) {
      case 'auth/invalid-email':
        throw new Error('Please enter a valid email address.')
      case 'auth/email-already-in-use':
        throw new Error('This email is already in use by another account.')
      case 'auth/requires-recent-login':
        throw new Error('Please sign in again before changing your email.')
      default:
        throw new Error('Failed to update email. Please try again.')
    }
  }
}

// Resend email verification
export const resendEmailVerification = async (): Promise<void> => {
  try {
    const user = auth.currentUser
    if (!user) {
      throw new Error('No user is currently signed in.')
    }
    
    if (user.emailVerified) {
      throw new Error('Email is already verified.')
    }
    
    await sendEmailVerification(user)
  } catch (error: any) {
    console.error('Error resending email verification:', error)
    throw new Error('Failed to resend verification email. Please try again.')
  }
}

// Sign out
export const signOutUser = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth)
  } catch (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

// Alias for signOutUser
export const signOut = signOutUser

// Get current user
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser
}

// Get user profile from Firestore
export const getUserProfile = async (uid: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, collections.users, uid))
    if (userDoc.exists()) {
      return { uid, ...userDoc.data() } as User
    }
    return null
  } catch (error) {
    console.error('Error getting user profile:', error)
    return null
  }
}

// Update user profile
export const updateUserProfile = async (
  uid: string,
  updates: Partial<Omit<User, 'uid' | 'createdAt'>>
): Promise<void> => {
  try {
    await updateDoc(doc(db, collections.users, uid), {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('Error updating user profile:', error)
    throw error
  }
}

// Update user consent
export const updateUserConsent = async (
  uid: string,
  consent: Partial<User['consent']>
): Promise<void> => {
  try {
    await updateDoc(doc(db, collections.users, uid), {
      'consent': consent,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('Error updating user consent:', error)
    throw error
  }
}

// Check if user has role
export const hasRole = (user: User | null, role: UserRole): boolean => {
  return user?.roles.includes(role) || false
}

// Check if user is official
export const isOfficial = (user: User | null): boolean => {
  return hasRole(user, 'official') || hasRole(user, 'moderator') || hasRole(user, 'admin')
}

// Check if user can access municipality
export const canAccessMunicipality = (
  user: User | null,
  municipalityCode: string
): boolean => {
  if (!user) return false
  if (hasRole(user, 'admin')) return true
  return user.municipalityCode === municipalityCode
}

// Auth state listener
export const onAuthStateChangedListener = (
  callback: (user: User | null) => void
) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const userProfile = await getUserProfile(firebaseUser.uid)
      callback(userProfile)
    } else {
      callback(null)
    }
  })
}

// Request notification permission and update user
export const requestNotificationPermissionAndUpdate = async (
  uid: string
): Promise<boolean> => {
  try {
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      await updateUserConsent(uid, { notifications: true })
      return true
    }
    return false
  } catch (error) {
    console.error('Error requesting notification permission:', error)
    return false
  }
}

// Update user's FCM token
export const updateFCMToken = async (
  uid: string,
  token: string | null
): Promise<void> => {
  try {
    await updateDoc(doc(db, collections.users, uid), {
      fcmToken: token,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('Error updating FCM token:', error)
    throw error
  }
}
