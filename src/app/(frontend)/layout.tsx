import { Outfit, Forum } from 'next/font/google'
import React from 'react'
import { StructuredData } from '@/components/seo/StructuredData'
import './styles.css'

const sans = Outfit({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const serif = Forum({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  weight: ['400'],
})

const baseUrl = 'https://www.hugohsi.dev'

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Hugo Hsi | Full-Stack Developer',
    template: '%s | Hugo Hsi',
  },
  description:
    'Full-stack developer specializing in React, Next.js, and Node.js. NYC-based and open to remote opportunities with hands-on agency experience delivering thoughtfully engineered applications.',
  keywords: [
    'full-stack developer',
    'React developer',
    'Next.js developer',
    'Node.js developer',
    'web developer NYC',
    'TypeScript developer',
  ],
  authors: [{ name: 'Hugo Hsi' }],
  creator: 'Hugo Hsi',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    title: 'Hugo Hsi | Full-Stack Developer',
    description:
      'Full-stack developer specializing in React, Next.js, and Node.js. NYC-based and open to remote opportunities.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Hugo Hsi Portfolio',
      },
    ],
    siteName: 'Hugo Hsi Portfolio',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hugo Hsi | Full-Stack Developer',
    description:
      'Full-stack developer specializing in React, Next.js, and Node.js. NYC-based and open to remote opportunities.',
    images: ['/twitter-image'],
    creator: '@hugohsi',
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
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/icon',
    apple: '/apple-icon',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <head>
        <StructuredData />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
