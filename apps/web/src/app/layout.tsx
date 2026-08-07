import type { Metadata, Viewport } from 'next'
import { Inter, Manrope } from 'next/font/google'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { AccessibilityProvider } from '@/components/AccessibilityProvider'
import { OfflineProvider } from '@/components/OfflineProvider'
import { AppShell } from '@/components/layout/AppShell'
import { OnboardingTutorial } from '@/components/OnboardingTutorial'
import { CompleteProfileModalWrapper } from '@/components/Auth/CompleteProfileModalWrapper'
import { Toaster } from '@/components/ui/Toaster'
import { Analytics } from '@/components/Analytics'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: {
    default: 'Serve SA — Building Better Communities Together',
    template: '%s | Serve SA',
  },
  description:
    'Built for South Africa. Built for every community. Report local service issues and track progress with your municipality.',
  keywords: [
    'South Africa',
    'service delivery',
    'municipality',
    'report issues',
    'public services',
    'civic reporting',
    'Serve SA',
  ],
  authors: [{ name: 'Serve SA' }],
  creator: 'Serve SA',
  publisher: 'Serve SA',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://servesa.co.za'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    url: 'https://servesa.co.za',
    title: 'Serve SA — Building Better Communities Together',
    description:
      'Built for South Africa. Built for every community. Report local service issues and track progress.',
    siteName: 'Serve SA',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Serve SA — Building Better Communities Together',
    description:
      'Built for South Africa. Built for every community. Report local service issues and track progress.',
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#002395',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en-ZA"
      className={`${inter.variable} ${manrope.variable}`}
      suppressHydrationWarning
    >
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AccessibilityProvider>
            <OfflineProvider>
              <AuthProvider>
                <AppShell>{children}</AppShell>
                <OnboardingTutorial />
                <CompleteProfileModalWrapper />
                <Toaster />
                <Analytics />
              </AuthProvider>
            </OfflineProvider>
          </AccessibilityProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
