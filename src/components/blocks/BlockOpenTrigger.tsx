'use client'

import { useExpandedBlockContext } from '@/components/blocks/contexts/ExpandedBlockContext'
import { useHighlightBlockContext } from '@/components/blocks/contexts/HighlightBlockContext'
import { ComponentProps } from 'react'

type BlockOpenTriggerProps = ComponentProps<'button'>

export default function BlockOpenTrigger(props: BlockOpenTriggerProps) {
  const { id, highlightBlock, setHighlightBlock } = useHighlightBlockContext()
  const { expandedBlock, setExpandedBlock, ref } = useExpandedBlockContext()

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
    <button
      {...props}
      onMouseOver={() => setHighlightBlock(true)}
      onMouseOut={() => setHighlightBlock(false)}
      onClick={handleExpandBlock}
    />
  )
}
