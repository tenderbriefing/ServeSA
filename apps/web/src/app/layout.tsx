import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { AccessibilityProvider } from '@/components/AccessibilityProvider'
import { OfflineProvider } from '@/components/OfflineProvider'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/Footer'
import { OnboardingTutorial } from '@/components/OnboardingTutorial'
import { CompleteProfileModalWrapper } from '@/components/Auth/CompleteProfileModalWrapper'
import { Toaster } from '@/components/ui/Toaster'
import { Analytics } from '@/components/Analytics'
import './globals.css'
import '../i18n/config'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'ServeSA - South African Service Platform',
    template: '%s | ServeSA'
  },
  description: 'Report and resolve service delivery issues across South Africa. Connect with your municipality and track progress in real-time.',
  keywords: [
    'South Africa',
    'service delivery',
    'municipality',
    'report issues',
    'public services',
    'government',
    'community',
    'infrastructure'
  ],
  authors: [{ name: 'ServeSA Team' }],
  creator: 'ServeSA',
  publisher: 'ServeSA',
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
    title: 'ServeSA - South African Service Platform',
    description: 'Report and resolve service delivery issues across South Africa',
    siteName: 'ServeSA',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'ServeSA - South African Service Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ServeSA - South African Service Platform',
    description: 'Report and resolve service delivery issues across South Africa',
    images: ['/og-image.jpg'],
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ServeSA" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AccessibilityProvider>
            <OfflineProvider>
              <AuthProvider>
                <div className="min-h-screen bg-background">
                  <Header />
                  <main>
                    {children}
                  </main>
                  <Footer />
                                        </div>
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
