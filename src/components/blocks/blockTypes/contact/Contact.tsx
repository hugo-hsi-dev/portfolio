import Block from '@/components/blocks/Block'
import Default from '@/components/blocks/blockTypes/contact/Default'
import Expanded from '@/components/blocks/blockTypes/contact/Expanded'
import { payload } from '@/lib/getPayload'
import ButtonHoverContextProvider from './contexts/ContactHoverContext'
import ContactDataProvider from './contexts/ContactDataContext'
import ContactDataContextProvider from './contexts/ContactDataContext'
import CopyEmailProvider from './contexts/CopyEmailContext'

export default async function Contact() {
  const contactData = await payload.findGlobal({
    slug: 'contacts',
  })

  return (
    <ContactDataContextProvider {...contactData}>
      <ButtonHoverContextProvider>
        <CopyEmailProvider>
          <Block
            id="contact"
            className="bg-zinc-200"
            defaultComponent={<Default />}
            expandedComponent={<Expanded />}
          />
        </CopyEmailProvider>
      </ButtonHoverContextProvider>
    </ContactDataContextProvider>
  )
}
