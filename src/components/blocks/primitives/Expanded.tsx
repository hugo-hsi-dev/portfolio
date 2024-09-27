'use client'

import { useExpandedBlockContext } from '@/components/blocks/contexts/ExpandedBlockContext'
import { ComponentProps, Fragment } from 'react'

type ExpandedProps = ComponentProps<typeof Fragment>

export default function Expanded({ ...props }: ExpandedProps) {
  const { expandedBlock } = useExpandedBlockContext()

  if (!expandedBlock) {
    return
  }

  return <Fragment {...props} />
}
