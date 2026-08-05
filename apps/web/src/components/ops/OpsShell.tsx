'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/ops', label: 'Dashboard' },
  { href: '/ops/cases', label: 'Cases' },
  { href: '/ops/team', label: 'Team' },
  { href: '/ops/settings', label: 'Settings' },
]

export function OpsShell({ children }: { children: React.ReactNode }) {
  const { user, loading, isOfficial, municipalityCode } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

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

  if (loading || !user || !isOfficial) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f1419] text-slate-300">
        Checking access…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f1419] text-slate-100">
      <header className="border-b border-slate-800 bg-[#12181f]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/ops" className="font-semibold tracking-tight text-white">
              ServeSA Ops
            </Link>
            <nav className="flex gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white',
                    pathname === item.href && 'bg-slate-800 text-white'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="text-xs text-slate-400">
            {municipalityCode || 'No municipality claim'}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  )
}
