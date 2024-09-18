import BentoGrid from '@/components/bentoGrid/BentoGrid'
import Contact from '@/components/block/blockTypes/contact/Contact'
import Hero from '@/components/block/blockTypes/hero/Hero'
import Container from '@/components/container/Container'
import { payload } from '@/lib/getPayload'
import { Media } from '@/payload-types'
export default async function RootPage() {
  const { openGraphImage } = await payload.findGlobal({
    slug: 'meta',
  })

  const image = openGraphImage as Media

  return (
    <div>
      <Container>
        <BentoGrid>
          <Hero />
          <Contact />
          {/* <Image src={formatImageSource(image.url)} alt={image.alt} width={240} height={240} /> */}
        </BentoGrid>
      </Container>
    </div>
  )
}
