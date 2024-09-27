import BentoGrid from '@/components/bentoGrid/BentoGrid'
import ContactBlock from '@/components/blocks/contactBlock/ContactBlock'
import HeroBlock from '@/components/blocks/heroBlock/HeroBlock'
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
          <HeroBlock />
          <ContactBlock />
          {/* <Image src={formatImageSource(image.url)} alt={image.alt} width={240} height={240} /> */}
        </BentoGrid>
      </Container>
    </div>
  )
}
