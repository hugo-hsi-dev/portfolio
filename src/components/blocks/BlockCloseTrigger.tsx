import { useExpandedBlockContext } from '@/components/blocks/contexts/ExpandedBlockContext'
import { useHighlightBlockContext } from '@/components/blocks/contexts/HighlightBlockContext'
import { ComponentProps } from 'react'

type BlockCloseTriggerProps = ComponentProps<'button'>

export default function BlockCloseTrigger(props: BlockCloseTriggerProps) {
  const { id, highlightBlock, setHighlightBlock } = useHighlightBlockContext()
  const { expandedBlock, setExpandedBlock } = useExpandedBlockContext()

  function handleExpandBlock() {
    setExpandedBlock(undefined)
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
