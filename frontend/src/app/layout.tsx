import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Layout from '@/components/Layout'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NutriScan - Smart Nutrition Tracking',
  description: 'Scan, track, and optimize your nutrition with AI-powered insights',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
  themeColor: '#10b981',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  keywords: ['nutrition', 'food tracking', 'barcode scanner', 'health', 'diet'],
  authors: [{ name: 'NutriScan Team' }],
  robots: 'index, follow',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://world.openfoodfacts.org" />
        <link rel="dns-prefetch" href="https://images.openfoodfacts.org" />
        <link rel="preload" href="/icons/icon-192x192.png" as="image" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <Layout>{children}</Layout>
          <Toaster 
            position="top-center"
            richColors
            closeButton
          />
        </AuthProvider>
      </body>
    </html>
  )
} 