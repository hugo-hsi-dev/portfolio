'use client'

import AboutMe from '@/components/blocks/blockTypes/hero/content/AboutMe'
import Heading from '@/components/blocks/blockTypes/hero/content/Heading'
import SubHeading from '@/components/blocks/blockTypes/hero/content/SubHeading'

type ExpandedProps = {
  aboutMe: string
}

export default function Expanded({ aboutMe }: ExpandedProps) {
  return (
    <div className="flex flex-col justify-between h-full gap-2">
      <Heading />

      <AboutMe aboutMe={aboutMe} />

      <SubHeading />
    </div>
  )
}
