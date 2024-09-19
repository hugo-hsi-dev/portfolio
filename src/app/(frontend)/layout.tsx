import { Media } from '@/payload-types'
import { Metadata } from 'next'

import { Manrope } from 'next/font/google'

import SideNav from '@/components/sideNav/SideNav'
import ExpandedBlockContextProvider from '@/components/blocks/contexts/ExpandedBlockContext'
import { payload } from '@/lib/getPayload'
import '@/styles/main.css'

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={manrope.className}>
      <body className="scroll-smooth">
        <ExpandedBlockContextProvider>
          <div className="fixed left-0 top-1/2 -translate-y-2/4">
            <SideNav />
          </div>
          <main className="mt-20">{children}</main>
        </ExpandedBlockContextProvider>
      </body>
    </html>
  )
}
