import TextUnderline from '@/components/animated/TextUnderline'
import ContactExpandedIcon from '@/components/block/blockTypes/contact/expandedItems/ContactExpandedIcon'
import ContactExpandedItem from '@/components/block/blockTypes/contact/expandedItems/ContactExpandedItem'
import ContactExpandedUrl from '@/components/block/blockTypes/contact/expandedItems/ContactExpandedUrl'

import { Mail } from 'lucide-react'
import { useState } from 'react'

type MailExpandedItemProps = {
  email: string
}

export default function EmailExpandedItem({ email }: MailExpandedItemProps) {
  const [isCopied, setIsCopied] = useState(false)

  function handleEmailClick() {
    navigator.clipboard.writeText(email)
    setIsCopied(true)
  }

  return (
    <ContactExpandedItem>
      <ContactExpandedIcon onClick={handleEmailClick} onMouseLeave={() => setIsCopied(false)}>
        <Mail className="text-white" width={50} height={50} onClick={handleEmailClick} />
      </ContactExpandedIcon>
      <ContactExpandedUrl onClick={handleEmailClick} onMouseOut={() => setIsCopied(false)}>
        <TextUnderline>{!isCopied ? email : 'Copied!'}</TextUnderline>
      </ContactExpandedUrl>
    </ContactExpandedItem>
  )
}
