'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import ReactGA from 'react-ga4'

export function Analytics() {
  const pathname = usePathname()

  useEffect(() => {
    // Initialize GA4
    if (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
      ReactGA.initialize(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID)
    }
  }, [])

  useEffect(() => {
    // Track page views
    if (pathname) {
      ReactGA.send({ hitType: 'pageview', page: pathname })
    }
  }, [pathname])

  return null
}
