'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  User,
  onAuthStateChanged,
  signInWithCustomToken,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { UserProfile } from '@/types'
import '@/i18n/config'

declare global {
  interface Window {
    /**
     * Playwright / pilot UAT bootstrap payload:
     * - Firebase custom token string, OR
     * - base64url JSON `{ email, password, mode: "password" }`
     */
    __PILOT_UAT_ID_TOKEN?: string
  }
}

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  isOfficial: boolean
  isAdmin: boolean
  municipalityCode: string | null
  claimsRoles: string[]
  refreshClaims: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  isOfficial: false,
  isAdmin: false,
  municipalityCode: null,
  claimsRoles: [],
  refreshClaims: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [claimsRoles, setClaimsRoles] = useState<string[]>([])
  const [municipalityCode, setMunicipalityCode] = useState<string | null>(null)

  const refreshClaims = async () => {
    if (!auth.currentUser) {
      setClaimsRoles([])
      setMunicipalityCode(null)
      return
    }
    const token = await auth.currentUser.getIdTokenResult(true)
    const roles = Array.isArray(token.claims.roles)
      ? (token.claims.roles as string[])
      : []
    setClaimsRoles(roles)
    setMunicipalityCode(
      token.claims.municipalityCode
        ? String(token.claims.municipalityCode)
        : null
    )
  }

  useEffect(() => {
    let cancelled = false
    let uatBootstrapDone = !window.__PILOT_UAT_ID_TOKEN?.trim()

    const applyUser = async (next: User | null) => {
      setUser(next)
      if (next) {
        try {
          const userDoc = await getDoc(doc(db, 'users', next.uid))
          if (userDoc.exists()) {
            setUserProfile(userDoc.data() as UserProfile)
          }
          const token = await next.getIdTokenResult(true)
          const roles = Array.isArray(token.claims.roles)
            ? (token.claims.roles as string[])
            : []
          setClaimsRoles(roles)
          setMunicipalityCode(
            token.claims.municipalityCode
              ? String(token.claims.municipalityCode)
              : null
          )
        } catch (error) {
          console.error('Error fetching user profile/claims:', error)
        }
      } else {
        setUserProfile(null)
        setClaimsRoles([])
        setMunicipalityCode(null)
      }
      // Do not clear loading until optional UAT sign-in has been attempted,
      // otherwise OpsShell redirects to /auth/signin before bootstrap finishes.
      if (uatBootstrapDone && !cancelled) {
        setLoading(false)
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (next) => {
      void applyUser(next)
    })

    // Pilot UAT: Playwright injects a custom token or password payload before navigation.
    const bootstrapUat = async () => {
      const raw = window.__PILOT_UAT_ID_TOKEN?.trim()
      if (!raw) {
        uatBootstrapDone = true
        if (!auth.currentUser && !cancelled) setLoading(false)
        return
      }
      try {
        if (!auth.currentUser) {
          if (raw.startsWith('eyJ')) {
            await signInWithCustomToken(auth, raw)
          } else {
            const padded = raw.replace(/-/g, '+').replace(/_/g, '/')
            const pad =
              padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
            const json = JSON.parse(atob(padded + pad)) as {
              email?: string
              password?: string
              mode?: string
            }
            if (json?.email && json?.password) {
              await signInWithEmailAndPassword(auth, json.email, json.password)
            }
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Pilot UAT sign-in failed:', error)
        }
      } finally {
        uatBootstrapDone = true
        if (!cancelled) {
          // If auth state already applied before the flag flipped, re-apply so
          // loading clears; if sign-in failed, clear loading for the gate UI.
          if (auth.currentUser) {
            void applyUser(auth.currentUser)
          } else {
            setLoading(false)
          }
        }
      }
    }
    void bootstrapUat()

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  const profileRoles = userProfile?.roles || []
  const mergedRoles = Array.from(new Set([...claimsRoles, ...profileRoles]))
  const isOfficial =
    mergedRoles.includes('official') ||
    mergedRoles.includes('admin') ||
    mergedRoles.includes('moderator') ||
    mergedRoles.includes('field_worker')
  const isAdmin = mergedRoles.includes('admin')

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        isOfficial,
        isAdmin,
        municipalityCode:
          municipalityCode ||
          (userProfile as any)?.municipalityCode ||
          (userProfile as any)?.municipalityId ||
          null,
        claimsRoles: mergedRoles,
        refreshClaims,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
