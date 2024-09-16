'use client'

import { useExpandedBlockContext } from '@/contexts/ExpandedBlockContext'
import { useHighlightBlockContext } from '@/contexts/HighlightBlockContext'
import { ComponentProps } from 'react'

type BlockOpenTriggerProps = ComponentProps<'button'>

export default function BlockOpenTrigger(props: BlockOpenTriggerProps) {
  const { id, highlightBlock, setHighlightBlock } = useHighlightBlockContext()
  const { expandedBlock, setExpandedBlock } = useExpandedBlockContext()

  function handleExpandBlock() {
    setExpandedBlock(id)
    setHighlightBlock(false)
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
