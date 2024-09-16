import TextUnderline from '@/components/animated/TextUnderline'
import ContactListIcon from '@/components/block/blockTypes/contact/contactListItem/ContactListIcon'
import ContactListItem from '@/components/block/blockTypes/contact/contactListItem/ContactListItem'
import ContactListURL from '@/components/block/blockTypes/contact/contactListItem/ContactListURL'
import { Mail } from 'lucide-react'
import { useState } from 'react'

type MailListItemProps = {
  email: string
}

export default function MailListItem({ email }: MailListItemProps) {
  const [isCopied, setIsCopied] = useState(false)

  function handleEmailClick() {
    navigator.clipboard.writeText(email)
    setIsCopied(true)
  }

  return (
    <ContactListItem>
      <ContactListIcon onClick={handleEmailClick} onMouseLeave={() => setIsCopied(false)}>
        <Mail className="text-white" width={50} height={50} onClick={handleEmailClick} />
      </ContactListIcon>
      <ContactListURL onClick={handleEmailClick} onMouseOut={() => setIsCopied(false)}>
        <TextUnderline>{!isCopied ? email : 'Copied!'}</TextUnderline>
      </ContactListURL>
    </ContactListItem>
  )
}
