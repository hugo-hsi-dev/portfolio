import { Outfit, Forum } from 'next/font/google'
import React from 'react'
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

export const metadata = {
  description: "Hugo Hsi - Full-stack developer with a designer's eye",
  title: 'Hugo Hsi | Portfolio',
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
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
