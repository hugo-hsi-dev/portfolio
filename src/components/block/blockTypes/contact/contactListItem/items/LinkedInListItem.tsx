import TextUnderline from '@/components/animated/TextUnderline'
import ContactListIcon from '@/components/block/blockTypes/contact/contactListItem/ContactListIcon'
import ContactListItem from '@/components/block/blockTypes/contact/contactListItem/ContactListItem'
import ContactListURL from '@/components/block/blockTypes/contact/contactListItem/ContactListURL'
import { Linkedin } from 'lucide-react'
import Link from 'next/link'

type LinkedinListItemProps = { linkedinUrl: string }

export default function LinkedInListItem({ linkedinUrl }: LinkedinListItemProps) {
  return (
    <ContactListItem>
      <Link href={linkedinUrl} target="_blank">
        <ContactListIcon>
          <Linkedin className="text-white" width={50} height={50} />
        </ContactListIcon>
      </Link>
      <Link href={linkedinUrl} target="_blank">
        <ContactListURL>
          <TextUnderline>{linkedinUrl}</TextUnderline>
        </ContactListURL>
      </Link>
    </ContactListItem>
  )
}
