'use client'

import { useExpandedBlockContext } from '@/components/blocks/contexts/ExpandedBlockContext'
import { useHighlightBlockContext } from '@/components/blocks/contexts/HighlightBlockContext'
import { cn } from '@/lib/classNameMerge'
import { AsChildProps } from '@/types/asChild'
import { Slot } from '@radix-ui/react-slot'
import { isValidElement } from 'react'

type ExpandTriggerProps = AsChildProps<'button'>

export default function ExpandTrigger({ className, asChild, ...props }: ExpandTriggerProps) {
  const { id, highlightBlock, setHighlightBlock } = useHighlightBlockContext()
  const { expandedBlock, setExpandedBlock, ref } = useExpandedBlockContext()

  if (asChild && !isValidElement(props.children)) {
    throw new Error('If using asChild, must have a single, valid child')
  }

  if (expandedBlock) {
    return <>{props.children}</>
  }

  const Component = asChild ? Slot : 'button'

  function handleExpandBlock() {
    setExpandedBlock(id)
    setHighlightBlock(false)
    setTimeout(() => {
      console.log(ref.current)
      if (ref.current) {
        // TODO: adjust these values once there are more elements on the page
        // ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        const elementRect = ref.current.getBoundingClientRect()
        const absoluteElementTop = elementRect.top + window.scrollY
        const middle = absoluteElementTop - window.innerHeight
        window.scrollTo({ top: middle, behavior: 'smooth' })
      }
    }, 500)
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
