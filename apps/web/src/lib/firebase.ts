import { initializeApp, getApps } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAJJmVgVCe8k5YmqjE7QKThOSs7tK_Dfac",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "servesa-aad53.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "servesa-aad53",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "servesa-aad53.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "171401876896",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:171401876896:web:29728c192852cc75a400c5",
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const functions = getFunctions(app, 'africa-south1')
/** Messaging is optional — unsupported browsers must not break app boot. */
export const messaging =
  typeof window !== 'undefined'
    ? (() => {
        try {
          return getMessaging(app)
        } catch {
          return null
        }
      })()
    : null

// Connect to emulators in development
if (process.env.NODE_ENV === 'development') {
  if (process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
    try {
      connectAuthEmulator(auth, 'http://localhost:9099')
      connectFirestoreEmulator(db, 'localhost', 8080)
      connectStorageEmulator(storage, 'localhost', 9199)
      connectFunctionsEmulator(functions, 'localhost', 5001)
    } catch (error) {
      console.warn('Emulator connection failed:', error)
    }
  }
}

// FCM Token management
export const requestNotificationPermission = async (): Promise<string | null> => {
  if (!messaging) return null

  try {
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      })
      return token
    }
    return null
  } catch (error) {
    console.error('Failed to get notification permission:', error)
    return null
  }
}

// FCM Message handling
export const onMessageListener = () => {
  if (!messaging) return () => {}

  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload)
    })
  })
}

// Firestore collections
export const collections = {
  users: 'users',
  cases: 'cases',
  caseEvents: 'caseEvents',
  municipalities: 'municipalities',
  wards: 'wards',
  capAlerts: 'cap_alerts',
  notifications: 'notifications',
} as const

// Storage paths
export const storagePaths = {
  caseMedia: (caseId: string) => `cases/${caseId}/media`,
  userAvatars: (userId: string) => `users/${userId}/avatar`,
  publicThumbnails: (caseId: string) => `cases/${caseId}/thumbnails`,
} as const

export default app
