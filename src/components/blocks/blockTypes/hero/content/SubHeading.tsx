'use client'

import BlockCloseTrigger from '@/components/blocks/BlockCloseTrigger'
import BlockOpenTrigger from '@/components/blocks/BlockOpenTrigger'
import { useExpandedBlockContext } from '@/components/blocks/contexts/ExpandedBlockContext'
import { useHighlightBlockContext } from '@/components/blocks/contexts/HighlightBlockContext'
import { motion } from 'framer-motion'

export default function SubHeading() {
  const { id } = useHighlightBlockContext()
  const { expandedBlock } = useExpandedBlockContext()
  const isExpanded = expandedBlock === id

  return (
    <motion.h2
      className="text-white text-4xl sm:text-5xl md:text-4xl font-bold"
      layoutId="subheading"
      layout="position"
    >
      I bring
      <br />
      <span className="text-fuchsia-500">
        {!isExpanded ? <BlockOpenTrigger>interactive</BlockOpenTrigger> : 'interactive'}
      </span>
      <br />
      <span className="text-sky-500">
        {!isExpanded ? 'design' : <BlockCloseTrigger>design</BlockCloseTrigger>}
      </span>{' '}
      to life
    </motion.h2>
  )
}
