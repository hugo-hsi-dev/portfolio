import { Media } from '@/payload-types'
import config from '@payload-config'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import Image from 'next/image'
export default async function RootPage() {
  const payload = await getPayloadHMR({ config })
  const { openGraphImage } = await payload.findGlobal({
    slug: 'meta',
  })

  console.log(openGraphImage)

  const image = openGraphImage as Media

  return (
    <div>
      <Image
        src={`${process.env.NEXT_PUBLIC_SERVER_URL}${image.url!}`}
        alt={image.alt}
        width={240}
        height={240}
      />
    </div>
  )
}
