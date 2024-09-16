import TextUnderline from '@/components/animated/TextUnderline'
import ContactListIcon from '@/components/block/blockTypes/contact/contactListItem/ContactListIcon'
import ContactListItem from '@/components/block/blockTypes/contact/contactListItem/ContactListItem'
import ContactListURL from '@/components/block/blockTypes/contact/contactListItem/ContactListURL'
import { Linkedin } from 'lucide-react'

type LinkedinListItemProps = { linkedinUrl: string }

export default function LinkedInListItem({ linkedinUrl }: LinkedinListItemProps) {
  return (
    <ContactListItem>
      <ContactListIcon>
        <Linkedin className="text-white" width={50} height={50} />
      </ContactListIcon>
      <ContactListURL>
        <TextUnderline>{linkedinUrl}</TextUnderline>
      </ContactListURL>
    </ContactListItem>
  )
}
