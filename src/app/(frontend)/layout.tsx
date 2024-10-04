import { Media } from '@/payload-types'
import { Metadata } from 'next'

import { Manrope } from 'next/font/google'

import Providers from '@/app/(frontend)/providers'
import ExpandedBlockContextProvider from '@/components/blocks/contexts/ExpandedBlockContext'
import SideNav from '@/components/sideNav/SideNav'
import { payload } from '@/lib/getServerPayload'
import '@/styles/main.css'
import { PropsWithChildren } from 'react'

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
  const { title, description, favicon, openGraphImage } = await payload.findGlobal({
    slug: 'meta',
  })

  // to satisfy Payloads type generation, as favicon variable could potentially be a number
  const { url: icons } = favicon as Media
  const { url: images } = openGraphImage as Media

  return {
    title,
    description,
    icons,
    openGraph: {
      images: images ?? '',
    },
  }
}

export default async function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" className={manrope.className}>
      <body className="scroll-smooth">
        <Providers>
          <ExpandedBlockContextProvider>
            <div className="fixed left-0 top-1/2 -translate-y-2/4">
              <SideNav />
            </div>
            <main className="mt-20">{children}</main>
          </ExpandedBlockContextProvider>
        </Providers>
      </body>
    </html>
  )
}
