'use client'

import { useExpandedBlockContext } from '@/components/blocks/contexts/ExpandedBlockContext'
import { useHighlightBlockContext } from '@/components/blocks/contexts/HighlightBlockContext'
import { ComponentProps } from 'react'
import { Slot } from '@radix-ui/react-slot'

type BlockOpenTriggerProps = ComponentProps<'button'> & {
  asChild?: boolean
}

export default function BlockOpenTrigger({ asChild, ...props }: BlockOpenTriggerProps) {
  const { id, highlightBlock, setHighlightBlock } = useHighlightBlockContext()
  const { expandedBlock, setExpandedBlock, ref } = useExpandedBlockContext()

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
      {...props}
      onMouseOver={() => setHighlightBlock(true)}
      onMouseOut={() => setHighlightBlock(false)}
      onClick={handleExpandBlock}
    />
  )
}
