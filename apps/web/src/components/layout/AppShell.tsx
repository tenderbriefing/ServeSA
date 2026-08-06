'use client'

import { usePathname } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/Footer'
import { cn } from '@/lib/utils'

type AppShellProps = {
  children: React.ReactNode
  className?: string
}

function isStaffRoute(pathname: string | null): boolean {
  if (!pathname) return false
  return (
    pathname === '/ops' ||
    pathname.startsWith('/ops/') ||
    pathname === '/field' ||
    pathname.startsWith('/field/')
  )
}

export function AppShell({ children, className }: AppShellProps) {
  const pathname = usePathname()
  const bare = isStaffRoute(pathname)

  if (bare) {
    return <div className={cn('min-h-screen', className)}>{children}</div>
  }

  return (
    <div className={cn('flex min-h-screen flex-col bg-canvas', className)}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Header />
      <main id="main-content" className="flex-1" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </div>
  )
}
