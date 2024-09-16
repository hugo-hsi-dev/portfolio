import TextUnderline from '@/components/animated/TextUnderline'
import ContactListIcon from '@/components/block/blockTypes/contact/contactListItem/ContactListIcon'
import ContactListItem from '@/components/block/blockTypes/contact/contactListItem/ContactListItem'
import ContactListURL from '@/components/block/blockTypes/contact/contactListItem/ContactListURL'
import { Github } from 'lucide-react'

type GithubListItemProps = { githubUrl: string }

export default function GithubListItem({ githubUrl }: GithubListItemProps) {
  return (
    <ContactListItem>
      <ContactListIcon>
        <Github className="text-white" width={50} height={50} />
      </ContactListIcon>
      <ContactListURL>
        <TextUnderline>{githubUrl}</TextUnderline>
      </ContactListURL>
    </ContactListItem>
  )
}
