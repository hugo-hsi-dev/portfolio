import { Media } from '@/payload-types'
import config from '@payload-config'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import { Metadata } from 'next'

import SideNav from '@/components/sideNav/SideNav'
import '@/styles/main.css'

export async function generateMetadata(): Promise<Metadata> {
  const payload = await getPayloadHMR({ config })
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
    <html lang="en">
      <body>
        <div className="fixed left-0 top-1/2 -translate-y-2/4">
          <SideNav />
        </div>
        {children}
      </body>
    </html>
  )
}
