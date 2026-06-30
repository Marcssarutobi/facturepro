import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/toaster'
import Script from 'next/script'
import './globals.css'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://facturapro.com'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: 'FacturaPro',
  title: {
    default: 'FacturaPro - Logiciel de facturation en ligne',
    template: '%s | FacturaPro',
  },
  description:
    'Logiciel SaaS pour créer, suivre et télécharger des factures professionnelles et des factures de vente normalisées.',
  keywords: [
    'logiciel de facturation',
    'facture en ligne',
    'facture de vente normalisée',
    'générateur de facture PDF',
    'gestion de factures',
    'FacturaPro',
  ],
  authors: [{ name: 'FacturaPro' }],
  creator: 'FacturaPro',
  publisher: 'FacturaPro',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        {children}
        <Toaster />
        {process.env.NODE_ENV === 'production' && <Analytics />}
        <Script
          src="https://cdn.fedapay.com/checkout.js?v=1.1.7"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  )
}
