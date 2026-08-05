'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface OfflineContextType {
  isOnline: boolean
  offlineReports: any[]
  addOfflineReport: (report: any) => void
  syncOfflineReports: () => Promise<void>
  clearOfflineReports: () => void
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined)

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true)
  const [offlineReports, setOfflineReports] = useState<any[]>([])

  useEffect(() => {
    const savedReports = localStorage.getItem('offlineReports')
    if (savedReports) {
      try {
        setOfflineReports(JSON.parse(savedReports))
      } catch (error) {
        console.error('Failed to parse offline reports:', error)
      }
    }
  }, [])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('offlineReports', JSON.stringify(offlineReports))
  }, [offlineReports])

  const addOfflineReport = (report: any) => {
    const reportWithId = {
      ...report,
      id: `offline-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
      isOffline: true,
    }
    setOfflineReports((prev) => [...prev, reportWithId])
  }

  const syncOfflineReports = async () => {
    if (!navigator.onLine || offlineReports.length === 0) return
    // Drafts are preserved locally; durable sync happens through the report wizard.
  }

  const clearOfflineReports = () => {
    setOfflineReports([])
    localStorage.removeItem('offlineReports')
  }

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        offlineReports,
        addOfflineReport,
        syncOfflineReports,
        clearOfflineReports,
      }}
    >
      {children}
    </OfflineContext.Provider>
  )
}

export function useOffline() {
  const context = useContext(OfflineContext)
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider')
  }
  return context
}
