import { Media } from '@/payload-types'
import config from '@payload-config'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import { Metadata } from 'next'
export async function generateMetadata(): Promise<Metadata> {
  const payload = await getPayloadHMR({ config })
  const { title, description, favicon } = await payload.findGlobal({
    slug: 'meta',
  })

  const { url: icons } = favicon as Media

  return {
    title,
    description,
    icons,
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
