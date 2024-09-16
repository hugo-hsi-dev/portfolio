'use client'

import Heading from '@/components/block/blockTypes/hero/content/Heading'
import SubHeading from '@/components/block/blockTypes/hero/content/SubHeading'

export default function Default() {
  return (
    <div className="flex flex-col justify-end h-full gap-2">
      <Heading />
      <SubHeading />
    </div>
  )
}
