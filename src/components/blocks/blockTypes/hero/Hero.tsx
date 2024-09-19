import Block from '@/components/blocks/Block'
import Default from '@/components/blocks/blockTypes/hero/Default'
import Expanded from '@/components/blocks/blockTypes/hero/Expanded'
import { payload } from '@/lib/getPayload'

export default async function Hero() {
  const { content } = await payload.findGlobal({
    slug: 'aboutMe',
  })

  return (
    <Block
      id="hero"
      cols={2}
      rows={2}
      className="bg-black"
      defaultComponent={<Default />}
      expandedComponent={<Expanded aboutMe={content} />}
    />
  )
}
