'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { cn } from '@/lib/utils'
import { Menu, X } from 'lucide-react'

const NAV = [
  { href: '/ops', label: 'Dashboard' },
  { href: '/ops/cases', label: 'Cases' },
  { href: '/ops/community', label: 'Community' },
  { href: '/ops/map', label: 'Map' },
  { href: '/ops/supervisor', label: 'Supervisor' },
  { href: '/ops/team', label: 'Team' },
  { href: '/ops/settings', label: 'Settings' },
  { href: '/field', label: 'Field' },
]

export function OpsShell({ children }: { children: React.ReactNode }) {
  const { user, loading, isOfficial, municipalityCode } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/auth/signin?next=/ops')
      return
    }
    if (!isOfficial) {
      router.replace('/dashboard')
    }
  }, [user, loading, isOfficial, router])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  if (loading || !user || !isOfficial) {
    return (
      <div className="theme-ops flex min-h-screen items-center justify-center bg-canvas text-ink-muted">
        Checking staff access…
      </div>
    )
  }

  return (
    <div className="theme-ops min-h-screen bg-canvas text-ink">
      <a href="#ops-main" className="skip-link">
        Skip to staff content
      </a>
      <header className="sticky top-0 z-sticky border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-4">
            <Link
              href="/ops"
              className="font-semibold tracking-tight text-ink"
            >
              Serve SA Ops
            </Link>
            <nav className="hidden gap-1 lg:flex" aria-label="Staff">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'inline-flex min-h-touch items-center rounded-md px-3 text-sm text-ink-muted hover:bg-surface-muted hover:text-ink',
                    pathname === item.href && 'bg-surface-muted text-ink'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-xs text-ink-subtle sm:block">
              {municipalityCode || 'Municipality claim missing'}
            </div>
            <Link
              href="/"
              className="hidden text-sm text-ink-muted hover:text-ink sm:inline"
            >
              Citizen site
            </Link>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-md text-ink-muted hover:bg-surface-muted lg:hidden"
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? 'Close staff menu' : 'Open staff menu'}
              onClick={() => setMobileOpen((open) => !open)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {mobileOpen ? (
          <nav
            className="border-t border-border px-4 py-3 lg:hidden"
            aria-label="Staff mobile"
          >
            <div className="flex flex-col gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'min-h-touch rounded-md px-3 py-2 text-sm text-ink-muted hover:bg-surface-muted hover:text-ink',
                    pathname === item.href && 'bg-surface-muted text-ink'
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <Link href="/" className="min-h-touch rounded-md px-3 py-2 text-sm">
                Citizen site
              </Link>
            </div>
          </nav>
        ) : null}
      </header>
      <main id="ops-main" className="mx-auto max-w-6xl px-4 py-6" tabIndex={-1}>
        {children}
      </main>
    </div>
  )
}
