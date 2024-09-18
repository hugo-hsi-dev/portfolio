import TextUnderline from '@/components/animated/TextUnderline'
import ContactExpandedIcon from '@/components/block/blockTypes/contact/expandedItems/ContactExpandedIcon'
import ContactExpandedItem from '@/components/block/blockTypes/contact/expandedItems/ContactExpandedItem'
import ContactExpandedUrl from '@/components/block/blockTypes/contact/expandedItems/ContactExpandedUrl'

import { Github } from 'lucide-react'
import Link from 'next/link'

type GithubExpandedItemProps = { githubUrl: string }

export default function GithubExpandedItem({ githubUrl }: GithubExpandedItemProps) {
  return (
    <ContactExpandedItem>
      <Link href={githubUrl} target="_blank">
        <ContactExpandedIcon>
          <Github className="text-white" width={50} height={50} />
        </ContactExpandedIcon>
      </Link>
      <Link href={githubUrl} target="_blank">
        <ContactExpandedUrl>
          <TextUnderline>{githubUrl}</TextUnderline>
        </ContactExpandedUrl>
      </Link>
    </ContactExpandedItem>
  )
}
