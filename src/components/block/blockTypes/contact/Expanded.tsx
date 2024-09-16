'use client'

import BlockCloseTrigger from '@/components/block/BlockCloseTrigger'
import GithubListItem from '@/components/block/blockTypes/contact/contactListItem/items/GithubListItem'
import LinkedInListItem from '@/components/block/blockTypes/contact/contactListItem/items/LinkedInListItem'
import MailListItem from '@/components/block/blockTypes/contact/contactListItem/items/MailListItem'

type ExpandedProps = {
  email: string
  githubUrl: string
  linkedinUrl: string
}

export default function Expanded({ email, githubUrl, linkedinUrl }: ExpandedProps) {
  return (
    <div className="flex flex-col justify-between h-full">
      <h3 className="text-7xl font-bold">
        Please{' '}
        <span className="text-sky-500">
          <BlockCloseTrigger>reach out!</BlockCloseTrigger>
        </span>
      </h3>
      <ul className="flex flex-col gap-12">
        <MailListItem email={email} />
        <GithubListItem githubUrl={githubUrl} />
        <LinkedInListItem linkedinUrl={linkedinUrl} />
      </ul>
    </div>
  )
}
