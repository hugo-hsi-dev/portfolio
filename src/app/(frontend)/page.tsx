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
      <Container></Container>
    </div>
  )
}
