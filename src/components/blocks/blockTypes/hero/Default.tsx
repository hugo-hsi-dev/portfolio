'use client'

import Heading from '@/components/blocks/blockTypes/hero/content/Heading'
import SubHeading from '@/components/blocks/blockTypes/hero/content/SubHeading'

export default function Default() {
  return (
    <div className="flex flex-col justify-end h-full gap-2">
      <Heading />
      <SubHeading />
    </div>
  )
}
