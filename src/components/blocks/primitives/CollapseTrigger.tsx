'use client'

import { useExpandedBlockContext } from '@/components/blocks/contexts/ExpandedBlockContext'
import { useHighlightBlockContext } from '@/components/blocks/contexts/HighlightBlockContext'
import { cn } from '@/lib/classNameMerge'
import { AsChildProps } from '@/types/asChild'
import { Slot } from '@radix-ui/react-slot'
import { isValidElement } from 'react'

type CollapseTriggerProps = AsChildProps<'button'>

export default function CollapseTrigger({ className, asChild, ...props }: CollapseTriggerProps) {
  const { id, highlightBlock, setHighlightBlock } = useHighlightBlockContext()
  const { expandedBlock, setExpandedBlock } = useExpandedBlockContext()

  if (asChild && !isValidElement(props.children)) {
    throw new Error('If using asChild, must have a single, valid child')
  }

  if (!expandedBlock) {
    return <>{props.children}</>
  }

  const Component = asChild ? Slot : 'button'

  function handleExpandBlock() {
    setExpandedBlock(undefined)
    setHighlightBlock(false)
  }

  return (
    <Component
      className={cn('cursor-pointer', className)}
      onMouseOver={() => setHighlightBlock(true)}
      onMouseOut={() => setHighlightBlock(false)}
      onClick={handleExpandBlock}
      {...props}
    />
  )
}
