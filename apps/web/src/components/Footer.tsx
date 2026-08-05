import Link from 'next/link'
import { MapPin, Mail } from 'lucide-react'

const citizenLinks = [
  { href: '/report', label: 'Report an Issue' },
  { href: '/case', label: 'Track a Case' },
  { href: '/dashboard', label: 'My Cases' },
  { href: '/notifications', label: 'Notifications' },
]

const supportLinks = [
  { href: '/help', label: 'Help' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Use' },
  { href: '/auth/signin', label: 'Sign in' },
]

export function Footer() {
  return (
    <footer className="no-print border-t border-border bg-surface-inverse text-ink-inverse">
      <div className="container py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-500">
                <MapPin className="h-4 w-4 text-white" aria-hidden />
              </span>
              <span className="text-lg font-semibold">Serve SA</span>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-slate-300">
              Report local service issues and track progress with your
              municipality. Serve SA is a civic reporting platform for South
              Africa — plain, secure, and designed for everyday use.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-200">
              For citizens
            </h2>
            <ul className="space-y-2.5">
              {citizenLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-300 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-200">
              Support
            </h2>
            <ul className="mb-6 space-y-2.5">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-300 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2 text-sm text-slate-300">
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

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-slate-700 pt-8 text-sm text-slate-400 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Serve SA. All rights reserved.</p>
          <p>Built for South African municipalities and the people they serve.</p>
        </div>
      </div>
    </footer>
  )
}
