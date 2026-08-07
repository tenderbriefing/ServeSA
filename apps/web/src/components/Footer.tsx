import Link from 'next/link'
import { Mail } from 'lucide-react'
import { brandCopy } from '@/lib/design-tokens'
import { CivicYDivider } from '@/components/civic/CivicMotif'

const citizenLinks = [
  { href: '/report', label: 'Report an Issue' },
  { href: '/case', label: 'Track a Case' },
  { href: '/dashboard', label: 'My Cases' },
  { href: '/help', label: 'Help' },
]

const supportLinks = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Use' },
  { href: '/auth/signin', label: 'Sign in' },
]

export function Footer() {
  return (
    <footer className="no-print border-t border-border bg-surface-inverse text-ink-inverse">
      <CivicYDivider className="opacity-70" />
      <div className="container py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-600"
                aria-hidden
              >
                <svg viewBox="0 0 36 36" className="h-8 w-8 text-white">
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
              <span className="font-display text-lg font-semibold">Serve SA</span>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-neutral-300">
              {brandCopy.tagline} A civic reporting platform for South Africa —
              plain, secure, and designed for everyday use.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-200">
              For citizens
            </h2>
            <ul className="space-y-2.5">
              {citizenLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-300 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-200">
              Support
            </h2>
            <ul className="mb-6 space-y-2.5">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-300 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2 text-sm text-neutral-300">
              <Mail className="h-4 w-4 shrink-0" aria-hidden />
              <a
                href="mailto:support@servesa.co.za"
                className="hover:text-white"
              >
                support@servesa.co.za
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-neutral-700 pt-8 text-sm text-neutral-400 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Serve SA. All rights reserved.</p>
          <p>{brandCopy.motto}</p>
        </div>
      </div>
    </footer>
  )
}
