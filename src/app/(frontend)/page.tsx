import BentoGrid from '@/components/bentoGrid/BentoGrid'
import HeroBlock from '@/components/blocks/heroBlock/HeroBlock'
import Container from '@/components/container/Container'
import ContactsSection from '@/components/sections/ContactsSection'
import { payload } from '@/lib/getServerPayload'
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
          <ContactsSection />
          {/* <Image src={formatImageSource(image.url)} alt={image.alt} width={240} height={240} /> */}
        </BentoGrid>
      </Container>
    </div>
  )
}
