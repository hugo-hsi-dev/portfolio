import Block from '@/components/block/Block'
import Default from '@/components/block/blockTypes/hero/Default'
import Expanded from '@/components/block/blockTypes/hero/Expanded'
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
