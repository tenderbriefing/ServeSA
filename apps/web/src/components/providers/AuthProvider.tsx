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
import type { UserProfile as CitizenProfile } from '@/types/auth'

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

/** Profile may include citizen fields and ops claim-adjacent metadata */
type AppUserProfile = CitizenProfile & {
  roles?: string[]
  displayName?: string
}

interface AuthContextType {
  user: User | null
  userProfile: AppUserProfile | null
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
  const [userProfile, setUserProfile] = useState<AppUserProfile | null>(null)
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
    let authStateSeen = false

    const clearLoadingIfReady = () => {
      if (uatBootstrapDone && authStateSeen && !cancelled) {
        setLoading(false)
      }
    }

    /**
     * Resolve identity immediately so citizen surfaces are not blocked on
     * Firestore profile / forced token refresh (those can take seconds).
     */
    const applyUser = async (next: User | null) => {
      authStateSeen = true
      setUser(next)
      if (!next) {
        setUserProfile(null)
        setClaimsRoles([])
        setMunicipalityCode(null)
        clearLoadingIfReady()
        return
      }

      // Unblock UI as soon as Firebase Auth knows the session.
      clearLoadingIfReady()

      try {
        const [userDoc, token] = await Promise.all([
          getDoc(doc(db, 'users', next.uid)),
          // Avoid force-refresh on every cold start — it delays first paint.
          next.getIdTokenResult(),
        ])
        if (cancelled) return
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as AppUserProfile)
        } else {
          setUserProfile(null)
        }
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
    }

    const unsubscribe = onAuthStateChanged(auth, (next) => {
      void applyUser(next)
    })

    // Pilot UAT: Playwright injects a custom token or password payload before navigation.
    const bootstrapUat = async () => {
      const raw = window.__PILOT_UAT_ID_TOKEN?.trim()
      if (!raw) {
        // No UAT payload — rely solely on onAuthStateChanged (incl. persistence).
        uatBootstrapDone = true
        clearLoadingIfReady()
        return
      }
      try {
        if (!auth.currentUser) {
          // JWT custom tokens have three base64url segments separated by '.'.
          // Password payloads are base64url JSON and often also start with "eyJ".
          const isJwt = raw.split('.').length === 3
          if (isJwt) {
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
          if (auth.currentUser) {
            void applyUser(auth.currentUser)
          } else {
            clearLoadingIfReady()
            // Auth may still be restoring; if onAuthStateChanged already fired
            // with null before UAT finished, clearLoadingIfReady handles it.
            if (authStateSeen) setLoading(false)
          }
        }
      }
    }
    void bootstrapUat()

    // Safety net: never leave the citizen shell on an infinite spinner.
    const safety = window.setTimeout(() => {
      if (!cancelled) setLoading(false)
    }, 4_000)

    return () => {
      cancelled = true
      window.clearTimeout(safety)
      unsubscribe()
    }
  }, [])

  // Privileges come from JWT custom claims only — never trust Firestore profile roles.
  const isOfficial =
    claimsRoles.includes('official') ||
    claimsRoles.includes('admin') ||
    claimsRoles.includes('moderator') ||
    claimsRoles.includes('field_worker') ||
    claimsRoles.includes('comms_editor') ||
    claimsRoles.includes('comms_publisher')
  const isAdmin = claimsRoles.includes('admin')

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
          null,
        claimsRoles,
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
