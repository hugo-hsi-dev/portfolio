import { Media } from '@/payload-types'
import config from '@payload-config'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import { Metadata } from 'next'
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
      <body>{children}</body>
    </html>
  )
}
