import TextUnderline from '@/components/animated/TextUnderline'
import ContactExpandedIcon from '@/components/block/blockTypes/contact/expandedItems/ContactExpandedIcon'
import ContactExpandedItem from '@/components/block/blockTypes/contact/expandedItems/ContactExpandedItem'
import ContactExpandedUrl from '@/components/block/blockTypes/contact/expandedItems/ContactExpandedUrl'

import { Linkedin } from 'lucide-react'
import Link from 'next/link'

type LinkedinExpandedItemProps = { linkedinUrl: string }

export default function LinkedinExpandedItem({ linkedinUrl }: LinkedinExpandedItemProps) {
  return (
    <ContactExpandedItem>
      <Link href={linkedinUrl} target="_blank">
        <ContactExpandedIcon>
          <Linkedin className="text-white" width={50} height={50} />
        </ContactExpandedIcon>
      </Link>
      <Link href={linkedinUrl} target="_blank">
        <ContactExpandedUrl>
          <TextUnderline>{linkedinUrl}</TextUnderline>
        </ContactExpandedUrl>
      </Link>
    </ContactExpandedItem>
  )
}
