'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Menu, X, User, LogOut, Settings, MapPin, Globe, Accessibility, MessageSquare, Bell, HelpCircle, Building2 } from 'lucide-react'
import { useState } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getInitials } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { useAccessibility } from '@/hooks/useAccessibility'
import { useOffline } from '@/hooks/useOffline'

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

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">ServeSA</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/report" className="text-gray-600 hover:text-gray-900 transition-colors">
              {t('navigation.report')}
            </Link>
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">
              {t('navigation.dashboard')}
            </Link>
            <Link href="/explore" className="text-gray-600 hover:text-gray-900 transition-colors">
              {t('navigation.explore')}
            </Link>
            <Link href="/community" className="text-gray-600 hover:text-gray-900 transition-colors">
              {t('navigation.community')}
            </Link>
            <Link href="/messaging" className="text-gray-600 hover:text-gray-900 transition-colors">
              <MessageSquare className="w-4 h-4 inline mr-1" />
              {t('navigation.messaging')}
            </Link>
            <Link href="/bulk-report" className="text-gray-600 hover:text-gray-900 transition-colors">
              {t('navigation.bulkReport')}
            </Link>
            <Link href="/anonymous-report" className="text-gray-600 hover:text-gray-900 transition-colors">
              {t('navigation.anonymousReport')}
            </Link>
            <Link href="/evidence" className="text-gray-600 hover:text-gray-900 transition-colors">
              {t('navigation.evidence')}
            </Link>
            <Link href="/training" className="text-gray-600 hover:text-gray-900 transition-colors">
              {t('navigation.training')}
            </Link>
            <Link href="/budget" className="text-gray-600 hover:text-gray-900 transition-colors">
              {t('navigation.budget')}
            </Link>
            <Link href="/municipality" className="text-gray-600 hover:text-gray-900 transition-colors">
              <Building2 className="w-4 h-4 inline mr-1" />
              My Municipality
            </Link>
            <Link href="/help" className="text-gray-600 hover:text-gray-900 transition-colors">
              <HelpCircle className="w-4 h-4 inline mr-1" />
              Help
            </Link>
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Language Switcher */}
            <LanguageSwitcher />
            
            {/* Offline Indicator */}
            {!isOnline && (
              <Badge variant="outline" className="text-orange-600 border-orange-200">
                Offline
              </Badge>
            )}
            {user ? (
              <div className="flex items-center space-x-3">
                {isOfficial && (
                  <Badge variant="success">Official</Badge>
                )}
                {isAdmin && (
                  <Badge variant="warning">Admin</Badge>
                )}
                <div className="flex items-center space-x-2">
                  <Link href="/notifications" className="relative">
                    <Bell className="w-5 h-5 text-gray-600 hover:text-gray-900" />
                    {/* Notification badge would go here */}
                  </Link>
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-700">
                      {getInitials(userProfile?.firstName + ' ' + userProfile?.lastName || user.email || 'U')}
                    </span>
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-sm font-medium text-gray-900">
                      {userProfile?.firstName + ' ' + userProfile?.lastName || user.email}
                    </p>
                    <p className="text-xs text-gray-500">
                      {userProfile?.municipalityCode || 'Citizen'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/auth">
                  <Button variant="ghost" size="sm">
                    {t('auth.login')}
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button size="sm">
                    {t('auth.signUp')}
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-4">
              <Link
                href="/report"
                className="text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('navigation.report')}
              </Link>
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('navigation.dashboard')}
              </Link>
              <Link
                href="/explore"
                className="text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('navigation.explore')}
              </Link>
              <Link
                href="/community"
                className="text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('navigation.community')}
              </Link>
              <Link
                href="/bulk-report"
                className="text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('navigation.bulkReport')}
              </Link>
              <Link
                href="/anonymous-report"
                className="text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('navigation.anonymousReport')}
              </Link>
              <Link
                href="/evidence"
                className="text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('navigation.evidence')}
              </Link>
              <Link
                href="/training"
                className="text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('navigation.training')}
              </Link>
              <Link
                href="/budget"
                className="text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('navigation.budget')}
              </Link>
              <Link
                href="/municipality"
                className="text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Building2 className="w-4 h-4 inline mr-1" />
                My Municipality
              </Link>
              <Link
                href="/messaging"
                className="text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <MessageSquare className="w-4 h-4 inline mr-1" />
                {t('navigation.messaging')}
              </Link>
            </nav>

            {/* Mobile Auth */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              {user ? (
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-700">
                        {getInitials(userProfile?.firstName + ' ' + userProfile?.lastName || user.email || 'U')}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {userProfile?.firstName + ' ' + userProfile?.lastName || user.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        {userProfile?.municipalityCode || 'Citizen'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleSignOut}
                    className="w-full"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('auth.signOut')}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col space-y-3">
                  <Link href="/auth">
                    <Button variant="outline" className="w-full">
                      {t('auth.login')}
                    </Button>
                  </Link>
                  <Link href="/auth">
                    <Button className="w-full">
                      {t('auth.signUp')}
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
