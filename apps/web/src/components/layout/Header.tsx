'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  Menu,
  X,
  LogOut,
  MapPin,
  MessageSquare,
  Bell,
  HelpCircle,
  Building2,
  ChevronDown,
} from 'lucide-react'
import { useState } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getInitials } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { useOffline } from '@/hooks/useOffline'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'

const primaryLinks = [
  { href: '/report', labelKey: 'navigation.report' },
  { href: '/dashboard', labelKey: 'navigation.dashboard' },
  { href: '/explore', labelKey: 'navigation.explore' },
  { href: '/community', labelKey: 'navigation.community' },
] as const

const moreLinks = [
  { href: '/messaging', labelKey: 'navigation.messaging', icon: MessageSquare },
  { href: '/bulk-report', labelKey: 'navigation.bulkReport' },
  { href: '/anonymous-report', labelKey: 'navigation.anonymousReport' },
  { href: '/evidence', labelKey: 'navigation.evidence' },
  { href: '/training', labelKey: 'navigation.training' },
  { href: '/budget', labelKey: 'navigation.budget' },
  { href: '/municipality', label: 'My Municipality', icon: Building2 },
  { href: '/help', labelKey: 'navigation.help', icon: HelpCircle },
] as const

export function Header() {
  const { t } = useTranslation()
  const { user, userProfile, isOfficial, isAdmin } = useAuth()
  const { isOnline } = useOffline()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
      : user?.email || 'U'

  const linkClass =
    'text-sm text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap'

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link href="/" className="flex items-center space-x-2 shrink-0">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">ServeSA</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {primaryLinks.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass}>
                {t(link.labelKey)}
              </Link>
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={`${linkClass} inline-flex items-center gap-1`}
                >
                  More
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {moreLinks.map((link) => {
                  const Icon = 'icon' in link ? link.icon : null
                  const label =
                    'labelKey' in link && link.labelKey
                      ? t(link.labelKey)
                      : 'label' in link
                        ? link.label
                        : ''
                  return (
                    <DropdownMenuItem key={link.href} asChild>
                      <Link href={link.href} className="flex items-center gap-2 cursor-pointer">
                        {Icon ? <Icon className="w-4 h-4 text-gray-500" /> : null}
                        {label}
                      </Link>
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <div className="hidden md:flex items-center gap-3 shrink-0">
            <LanguageSwitcher />

            {!isOnline && (
              <Badge variant="outline" className="text-orange-600 border-orange-200">
                Offline
              </Badge>
            )}

            {user ? (
              <div className="flex items-center gap-2">
                {isOfficial && <Badge variant="success">Official</Badge>}
                {isAdmin && <Badge variant="warning">Admin</Badge>}
                <Link
                  href="/notifications"
                  className="p-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-50"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-2 pl-1">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-700">
                      {getInitials(displayName)}
                    </span>
                  </div>
                  <div className="hidden xl:block max-w-[140px]">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {displayName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {userProfile?.municipalityCode || 'Citizen'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-gray-600 hover:text-gray-900"
                  aria-label={t('auth.signOut')}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth">
                  <Button variant="ghost" size="sm">
                    {t('auth.login')}
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button size="sm">{t('auth.signUp')}</Button>
                </Link>
              </div>
            )}
          </div>

          <button
            type="button"
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col gap-1">
              <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Main
              </p>
              {primaryLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-2 py-2 rounded-md text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t(link.labelKey)}
                </Link>
              ))}

              <p className="px-1 pt-4 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                More
              </p>
              {moreLinks.map((link) => {
                const Icon = 'icon' in link ? link.icon : null
                const label =
                  'labelKey' in link && link.labelKey
                    ? t(link.labelKey)
                    : 'label' in link
                      ? link.label
                      : ''
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-2 py-2 rounded-md text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {Icon ? <Icon className="w-4 h-4 text-gray-500" /> : null}
                    {label}
                  </Link>
                )
              })}
            </nav>

            <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
              <LanguageSwitcher />
              {!isOnline && (
                <Badge variant="outline" className="text-orange-600 border-orange-200">
                  Offline
                </Badge>
              )}

              {user ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-700">
                        {getInitials(displayName)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{displayName}</p>
                      <p className="text-xs text-gray-500">
                        {userProfile?.municipalityCode || 'Citizen'}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/notifications"
                    className="text-sm text-gray-600 hover:text-gray-900"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Notifications
                  </Link>
                  <Button variant="outline" onClick={handleSignOut} className="w-full">
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('auth.signOut')}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      {t('auth.login')}
                    </Button>
                  </Link>
                  <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full">{t('auth.signUp')}</Button>
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
