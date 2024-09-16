'use client'

import AboutMe from '@/components/block/blockTypes/hero/content/AboutMe'
import Heading from '@/components/block/blockTypes/hero/content/Heading'
import SubHeading from '@/components/block/blockTypes/hero/content/SubHeading'

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
