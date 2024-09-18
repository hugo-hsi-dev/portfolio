import Block from '@/components/block/Block'
import Default from '@/components/block/blockTypes/contact/Default'
import Expanded from '@/components/block/blockTypes/contact/Expanded'
import ContactBlockProvider from '@/contexts/ContactBlockContext'
import { payload } from '@/lib/getPayload'

export default async function Contact() {
  const contactInfo = await payload.findGlobal({
    slug: 'contacts',
  })
  return (
    <ContactBlockProvider {...contactInfo}>
      <Block
        id="contact"
        className="bg-zinc-200"
        defaultComponent={<Default {...contactInfo} />}
        expandedComponent={<Expanded {...contactInfo} />}
      />
    </ContactBlockProvider>
  )
}
