'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  Menu,
  X,
  LogOut,
  Bell,
  FileText,
  Search,
  User,
  Megaphone,
  Lightbulb,
  Building2,
} from 'lucide-react'
import { FEATURE_FLAGS } from '@/lib/constants'
import { useEffect, useId, useRef, useState } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getInitials } from '@/lib/utils'
import { useOffline } from '@/hooks/useOffline'
import { cn } from '@/lib/utils'

/** Citizen primary nav — Report / Updates / Ideas / Municipality / Track / My Cases */
const basePrimaryLinks = [
  { href: '/report', label: 'Report', icon: FileText },
  { href: '/updates', label: 'Updates', icon: Megaphone },
  { href: '/ideas', label: 'Ideas', icon: Lightbulb },
  { href: '/municipality', label: 'Our Municipality', icon: Building2 },
  { href: '/case', label: 'Track', icon: Search },
  { href: '/dashboard', label: 'My Cases', icon: User },
] as const

export function Header() {
  const { user, userProfile, isOfficial, isAdmin } = useAuth()
  const { isOnline } = useOffline()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const menuId = useId()
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const firstLinkRef = useRef<HTMLAnchorElement>(null)

  const handleSignOut = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const displayName =
    userProfile?.firstName && userProfile?.lastName
      ? `${userProfile.firstName} ${userProfile.lastName}`
      : user?.email || 'Account'

  const primaryLinks = basePrimaryLinks.filter((link) => {
    if (link.href === '/municipality') {
      return FEATURE_FLAGS.enableMunicipalPlanning
    }
    if (link.href === '/updates' || link.href === '/ideas') {
      return FEATURE_FLAGS.enableCommunityEngagement
    }
    return true
  })

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!mobileMenuOpen) return
    firstLinkRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false)
        menuButtonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileMenuOpen])

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname?.startsWith(href))

  const linkClass = (href: string) =>
    cn(
      'inline-flex min-h-touch items-center rounded-md px-2.5 text-sm font-medium transition-colors duration-fast',
      isActive(href)
        ? 'text-primary-700 bg-primary-50'
        : 'text-ink-muted hover:text-ink hover:bg-surface-muted'
    )

  return (
    <header className="sticky top-0 z-sticky border-b border-border bg-surface/95 backdrop-blur-sm">
      <div className="container">
        <div className="flex h-16 items-center justify-between gap-3">
          <Link
            href="/"
            className="flex min-h-touch shrink-0 items-center gap-2.5 rounded-md"
            aria-label="Serve SA home"
          >
            <span
              className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-md bg-primary-600 text-white"
              aria-hidden
            >
              <svg viewBox="0 0 36 36" className="h-9 w-9" aria-hidden>
                <path
                  d="M8 8 L18 18 L8 28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  opacity="0.85"
                />
                <path
                  d="M28 8 L18 18 L28 28"
                  fill="none"
                  stroke="rgb(0 122 77)"
                  strokeWidth="2"
                  opacity="0.9"
                />
                <circle cx="18" cy="18" r="2.5" fill="rgb(255 184 28)" />
              </svg>
            </span>
            <span className="font-display text-lg font-semibold tracking-tight text-ink">
              Serve SA
            </span>
          </Link>

          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="Primary"
          >
            {primaryLinks.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass(link.href)}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {!isOnline && (
              <Badge
                variant="outline"
                className="border-warning-border bg-warning-tint text-warning"
              >
                Offline — drafts are saved on this device
              </Badge>
            )}

            <Link
              href="/notifications"
              className="inline-flex h-11 w-11 items-center justify-center rounded-md text-ink-muted hover:bg-surface-muted hover:text-ink"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" aria-hidden />
            </Link>

            {user ? (
              <div className="flex items-center gap-2 pl-1">
                {isOfficial && (
                  <Badge className="bg-green-100 text-green-800">Staff</Badge>
                )}
                {isAdmin && (
                  <Badge className="bg-gold-100 text-gold-800">Admin</Badge>
                )}
                <div className="flex items-center gap-2 rounded-md px-2 py-1">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-800"
                    aria-hidden
                  >
                    {getInitials(displayName)}
                  </span>
                  <span className="hidden max-w-[140px] truncate text-sm font-medium text-ink xl:inline">
                    {displayName}
                  </span>
                </div>
                {(isOfficial || isAdmin) && (
                  <Link href="/ops">
                    <Button variant="outline" size="sm">
                      Staff console
                    </Button>
                  </Link>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  aria-label="Sign out"
                  className="min-h-touch min-w-touch"
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/signin">
                  <Button variant="ghost" size="sm">
                    Sign in
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button variant="brand" size="sm">
                    Create account
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <button
            ref={menuButtonRef}
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-ink-muted hover:bg-surface-muted hover:text-ink md:hidden"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-expanded={mobileMenuOpen}
            aria-controls={menuId}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            data-testid="mobile-menu-button"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" aria-hidden />
            ) : (
              <Menu className="h-6 w-6" aria-hidden />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div
            id={menuId}
            className="border-t border-border py-4 md:hidden"
            data-testid="mobile-menu"
          >
            <nav className="flex flex-col gap-1" aria-label="Mobile primary">
              {primaryLinks.map((link, index) => (
                <Link
                  key={link.href}
                  ref={index === 0 ? firstLinkRef : undefined}
                  href={link.href}
                  className={cn(linkClass(link.href), 'w-full justify-start gap-2 px-3')}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <link.icon className="h-4 w-4" aria-hidden />
                  {link.label}
                </Link>
              ))}
              <Link
                href="/notifications"
                className={cn(linkClass('/notifications'), 'w-full justify-start gap-2 px-3')}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Bell className="h-4 w-4" aria-hidden />
                Notifications
              </Link>
            </nav>

            <div className="mt-4 space-y-3 border-t border-border pt-4">
              {!isOnline && (
                <Badge
                  variant="outline"
                  className="border-warning-border bg-warning-tint text-warning"
                >
                  Offline — drafts are saved on this device
                </Badge>
              )}

              {user ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 px-1">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-800">
                      {getInitials(displayName)}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-ink">{displayName}</p>
                      <p className="text-xs text-ink-subtle">Signed in</p>
                    </div>
                  </div>
                  {(isOfficial || isAdmin) && (
                    <Link href="/ops" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full">
                        Staff console
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="outline"
                    onClick={handleSignOut}
                    className="w-full"
                  >
                    <LogOut className="mr-2 h-4 w-4" aria-hidden />
                    Sign out
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link href="/auth/signin" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Sign in
                    </Button>
                  </Link>
                  <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="brand" className="w-full">
                      Create account
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
