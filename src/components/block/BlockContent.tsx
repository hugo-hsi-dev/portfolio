'use client'

import { useExpandedBlockContext } from '@/contexts/ExpandedBlockContext'
import { useHighlightBlockContext } from '@/contexts/HighlightBlockContext'
import { cn } from '@/lib/classNameMerge'
import { motion } from 'framer-motion'
import { ComponentProps, ReactNode } from 'react'

type BlockContentProps = ComponentProps<typeof motion.div> & {
  id: string
  cols?: number
  rows?: number
  defaultComponent: ReactNode
  expandedComponent: ReactNode
}

function getColumns(columns: number) {
  if (columns > 3) {
    throw new Error('columns can be no greater than 3')
  }

  const columnLookup: Record<number, string> = {
    1: 'col-span-1',
    2: 'col-span-2',
    3: 'col-span-3',
  }

  return columnLookup[columns]
}

function getRows(rows: number) {
  if (rows > 2) {
    throw new Error('rows can be no greater than 3')
  }

  const rowLookup: Record<number, string> = {
    1: 'row-span-1',
    2: 'row-span-2',
  }

  return rowLookup[rows]
}

export default function BlockContent({
  defaultComponent,
  expandedComponent,
  className,
  id,
  cols = 1,
  rows = 1,
  ...props
}: BlockContentProps) {
  const { expandedBlock, setExpandedBlock } = useExpandedBlockContext()
  const { highlightBlock, setHighlightBlock } = useHighlightBlockContext()
  const isExpanded = expandedBlock === id

  console.log(id)

  if (!isExpanded) {
    return (
      <motion.div
        className={cn(
          `p-12 transition-shadow aspect-square ${highlightBlock && !isExpanded && 'ring-8 ring-offset-8 ring-fuchsia-500'} ${getColumns(cols)} ${getRows(rows)}`,
          className,
        )}
        layout
        layoutId={id}
        {...props}
        style={{ borderRadius: 24 }}
      >
        {defaultComponent}
      </motion.div>
    )
  }
  return (
    <motion.div
      className={cn(
        `p-12 transition-shadow ${highlightBlock && isExpanded && 'ring-8 ring-offset-8 ring-sky-500'} aspect-[3/2] col-span-3 row-span-2`,
        className,
      )}
      layout
      layoutId={id}
      {...props}
      style={{ borderRadius: 24 }}
    >
      {expandedComponent}
    </motion.div>
  )
}
