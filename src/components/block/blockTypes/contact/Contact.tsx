import Block from '@/components/block/Block'
import Default from '@/components/block/blockTypes/contact/Default'
import Expanded from '@/components/block/blockTypes/contact/Expanded'
import { payload } from '@/lib/getPayload'

export default async function Contact() {
  const contactInfo = await payload.findGlobal({
    slug: 'contacts',
  })
  return (
    <Block
      id="contact"
      className="bg-zinc-200"
      defaultComponent={<Default {...contactInfo} />}
      expandedComponent={<Expanded {...contactInfo} />}
    />
  )
}
