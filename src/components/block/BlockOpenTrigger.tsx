'use client'

import { useExpandedBlockContext } from '@/contexts/ExpandedBlockContext'
import { useHighlightBlockContext } from '@/contexts/HighlightBlockContext'
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
        ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 250)
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
