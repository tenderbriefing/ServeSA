import { useState, useEffect } from 'react'

export function useOffline() {
  const [isOnline, setIsOnline] = useState(true)
  const [offlineReports, setOfflineReports] = useState<any[]>([])

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    // Check initial state
    setIsOnline(navigator.onLine)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Load offline reports from localStorage
    const storedReports = localStorage.getItem('offlineReports')
    if (storedReports) {
      setOfflineReports(JSON.parse(storedReports))
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const addOfflineReport = (report: any) => {
    const newReports = [...offlineReports, { ...report, id: Date.now().toString() }]
    setOfflineReports(newReports)
    localStorage.setItem('offlineReports', JSON.stringify(newReports))
  }

  const removeOfflineReport = (reportId: string) => {
    const newReports = offlineReports.filter(report => report.id !== reportId)
    setOfflineReports(newReports)
    localStorage.setItem('offlineReports', JSON.stringify(newReports))
  }

  const clearOfflineReports = () => {
    setOfflineReports([])
    localStorage.removeItem('offlineReports')
  }

  return {
    isOnline,
    offlineReports,
    addOfflineReport,
    removeOfflineReport,
    clearOfflineReports,
  }
}
