import ContactDefaultButton from '@/components/block/blockTypes/contact/defaultButtons/ContactDefaultButton'
import { useContactBlockContext } from '@/contexts/ContactBlockContext'
import { Linkedin } from 'lucide-react'
import Link from 'next/link'

export default function LinkedinDefaultButton() {
  const { linkedinUrl, setHoveredItem } = useContactBlockContext()

  return (
    <Link href={linkedinUrl} target="_blank">
      <ContactDefaultButton
        onMouseOver={() => setHoveredItem('Linkedin')}
        onMouseOut={() => {
          setHoveredItem(undefined)
        }}
      >
        <Linkedin />
      </ContactDefaultButton>
    </Link>
  )
}
