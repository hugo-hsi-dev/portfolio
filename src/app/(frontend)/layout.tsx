import React from 'react'
import './styles.css'

export const metadata = {
  description: "Hugo Hsi - Full-stack developer with a designer's eye",
  title: 'Hugo Hsi | Portfolio',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
