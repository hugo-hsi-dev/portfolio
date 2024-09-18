import ContactButton from '@/components/block/blockTypes/contact/defaultButtons/ContactDefaultButton'
import { useContactBlockContext } from '@/contexts/ContactBlockContext'
import { GithubIcon } from 'lucide-react'
import Link from 'next/link'

export default function GithubDefaultButton() {
  const { githubUrl, setHoveredItem } = useContactBlockContext()
  return (
    <Link href={githubUrl} target="_blank">
      <ContactButton
        onMouseOver={() => setHoveredItem('Github')}
        onMouseOut={() => {
          setHoveredItem(undefined)
        }}
      >
        <GithubIcon />
      </ContactButton>
    </Link>
  )
}
