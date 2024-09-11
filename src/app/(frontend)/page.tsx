import { Media } from '@/payload-types'
import config from '@payload-config'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import NextImage, { StaticImageData } from 'next/image'
export default async function RootPage() {
  const payload = await getPayloadHMR({ config })
  const { openGraphImage } = await payload.findGlobal({
    slug: 'meta',
  })

  console.log(openGraphImage)

  const image = openGraphImage as Media

  let src: StaticImageData | string = image.url || ''

  src = `${process.env.NEXT_PUBLIC_VERCEL_URL}${src}`

  return (
    <div>
      <NextImage src={src} alt={image.alt} width={240} height={240} />
    </div>
  )
}
