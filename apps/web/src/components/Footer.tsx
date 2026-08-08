import Link from 'next/link'
import { Mail } from 'lucide-react'
import { brandCopy } from '@/lib/design-tokens'
import { FEATURE_FLAGS } from '@/lib/constants'

const baseNavLinks = [
  { href: '/report', label: 'Report an Issue' },
  { href: '/updates', label: 'Municipal Updates' },
  { href: '/ideas', label: 'Share an Idea' },
  { href: '/municipality', label: 'Our Municipality' },
  { href: '/case', label: 'Track a Case' },
  { href: '/dashboard', label: 'My Cases' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Use' },
  { href: '/auth/signin', label: 'Sign In' },
]

const footerLinkClass =
  'rounded-sm text-[13px] leading-none text-neutral-300 transition-colors duration-150 ease-civic hover:text-gold-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-inverse md:text-sm'

export function Footer() {
  const year = new Date().getFullYear()
  const navLinks = baseNavLinks.filter((link) => {
    if (link.href === '/municipality') {
      return FEATURE_FLAGS.enableMunicipalPlanning
    }
    if (link.href === '/updates' || link.href === '/ideas') {
      return FEATURE_FLAGS.enableCommunityEngagement
    }
    return true
  })

  return (
    <footer className="no-print bg-surface-inverse text-ink-inverse">
      <div className="mx-auto max-w-7xl px-4 py-5 md:px-6 md:py-4">
        {/* Primary row: brand · links · support */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-3 lg:gap-4">
          <Link
            href="/"
            className="inline-flex shrink-0 items-center gap-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-inverse"
            aria-label="Serve SA home"
          >
            <span
              className="flex h-[26px] w-[26px] items-center justify-center rounded-md bg-primary-600"
              aria-hidden
            >
              <svg viewBox="0 0 36 36" className="h-[26px] w-[26px] text-white">
                <path
                  d="M8 8 L18 18 L8 28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M28 8 L18 18"
                  fill="none"
                  stroke="rgb(0 122 77)"
                  strokeWidth="2"
                />
                <circle cx="18" cy="18" r="2.2" fill="rgb(255 184 28)" />
              </svg>
            </span>
            <span className="font-display text-base font-semibold leading-none tracking-tight md:text-lg">
              Serve SA
            </span>
          </Link>

          <span
            className="hidden h-3.5 w-px shrink-0 bg-white/15 md:block"
            aria-hidden
          />

          <nav
            aria-label="Footer"
            className="flex min-w-0 flex-1 flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-y-1.5"
          >
            <ul className="flex flex-wrap items-center gap-y-1.5">
              {navLinks.map((link, index) => (
                <li key={link.href} className="flex items-center">
                  {index > 0 ? (
                    <span
                      className="mx-2 select-none text-[11px] text-white/20"
                      aria-hidden
                    >
                      |
                    </span>
                  ) : null}
                  <Link href={link.href} className={footerLinkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <span
              className="mx-2 hidden select-none text-[11px] text-white/20 sm:inline"
              aria-hidden
            >
              |
            </span>

            <a
              href="mailto:support@servesa.co.za"
              className="inline-flex items-baseline gap-1.5 rounded-sm text-[13px] leading-none text-neutral-300 transition-colors duration-150 ease-civic hover:text-gold-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-inverse"
              aria-label="Email Serve SA support at support@servesa.co.za"
            >
              <Mail className="relative top-px h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>support@servesa.co.za</span>
            </a>
          </nav>
        </div>

        {/* Subtle divider + copyright */}
        <div className="mt-3 flex flex-col gap-1 border-t border-white/10 pt-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <p className="text-xs leading-snug text-neutral-400">
            © {year} Serve SA
          </p>
          <p className="text-xs leading-snug text-neutral-400">
            {brandCopy.motto}
          </p>
        </div>
      </div>
    </footer>
  )
}
