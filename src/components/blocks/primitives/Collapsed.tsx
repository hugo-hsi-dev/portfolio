'use client'

import { useExpandedBlockContext } from '@/components/blocks/contexts/ExpandedBlockContext'
import { ComponentProps, Fragment } from 'react'

type CollapsedProps = ComponentProps<typeof Fragment>

export default function Collapsed({ ...props }: CollapsedProps) {
  const { expandedBlock } = useExpandedBlockContext()

  if (expandedBlock) {
    return
  }

  return <Fragment {...props} />
}
