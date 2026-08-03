'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface OfflineContextType {
  isOnline: boolean
  offlineReports: any[]
  addOfflineReport: (report: any) => void
  syncOfflineReports: () => Promise<void>
  clearOfflineReports: () => void
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined)

export function OfflineProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const [isOnline, setIsOnline] = useState(true)
  const [offlineReports, setOfflineReports] = useState<any[]>([])

  // Load offline reports from localStorage on mount
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

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Attempt to sync offline reports when coming back online
      syncOfflineReports()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Set initial online status
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Save offline reports to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('offlineReports', JSON.stringify(offlineReports))
  }, [offlineReports])

  const addOfflineReport = (report: any) => {
    const reportWithId = {
      ...report,
      id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
      isOffline: true,
    }
    
    setOfflineReports(prev => [...prev, reportWithId])
  }

  const syncOfflineReports = async () => {
    if (!isOnline || offlineReports.length === 0) return

    try {
      // Attempt to sync each offline report
      const reportsToSync = [...offlineReports]
      
      for (const report of reportsToSync) {
        try {
          // Here you would make the actual API call to submit the report
          // For now, we'll simulate a successful sync
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // Remove successfully synced report
          setOfflineReports(prev => prev.filter(r => r.id !== report.id))
        } catch (error) {
          console.error('Failed to sync report:', report.id, error)
          // Keep the report in offline storage if sync fails
        }
      }
    } catch (error) {
      console.error('Failed to sync offline reports:', error)
    }
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
