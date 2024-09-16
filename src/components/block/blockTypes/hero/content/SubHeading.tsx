'use client'

import BlockCloseTrigger from '@/components/block/BlockCloseTrigger'
import BlockOpenTrigger from '@/components/block/BlockOpenTrigger'
import { useExpandedBlockContext } from '@/contexts/ExpandedBlockContext'
import { useHighlightBlockContext } from '@/contexts/HighlightBlockContext'
import { motion } from 'framer-motion'

export default function SubHeading() {
  const { id } = useHighlightBlockContext()
  const { expandedBlock } = useExpandedBlockContext()
  const isExpanded = expandedBlock === id

  return (
    <motion.h2 className="text-white text-8xl font-bold" layoutId="subheading" layout="position">
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
