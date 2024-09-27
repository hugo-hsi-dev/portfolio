'use client'

import { useExpandedBlockContext } from '@/components/blocks/contexts/ExpandedBlockContext'
import { useHighlightBlockContext } from '@/components/blocks/contexts/HighlightBlockContext'
import { cn } from '@/lib/classNameMerge'
import { motion } from 'framer-motion'
import { ComponentProps } from 'react'

type BlockContentProps = ComponentProps<typeof motion.div> & {
  id: string
  cols?: number
  rows?: number
}

export default function BlockContent({
  className,
  id,
  cols = 1,
  rows = 1,
  ...props
}: BlockContentProps) {
  const { expandedBlock, setExpandedBlock, ref } = useExpandedBlockContext()
  const { highlightBlock, setHighlightBlock } = useHighlightBlockContext()
  const isExpanded = expandedBlock === id

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

  function getExpanded(isExpanded: boolean) {
    return isExpanded ? 'aspect-[2/3] sm:aspect-[3/2] col-span-3 row-span-2' : ''
  }

  function getHighlight(highlightBlock: boolean, isExpanded: boolean) {
    if (!highlightBlock) {
      return
    }
    return !isExpanded ? 'ring-8 ring-offset-8 ring-lime-500' : 'ring-8 ring-offset-8 ring-rose-500'
  }

  return (
    <motion.div
      ref={ref}
      key={id}
      className={cn(
        'p-[5%] transition-shadow aspect-square',
        getColumns(cols),
        getRows(rows),
        getExpanded(isExpanded),
        getHighlight(highlightBlock, isExpanded),
        className,
      )}
      layoutId={id}
      transition={{ type: 'spring' }}
      style={{ borderRadius: 24 }}
      {...props}
    />
  )

  // `p-6 sm:p-8 md:p-10 lg:p-12 transition-shadow ${highlightBlock && isExpanded && 'ring-8 ring-offset-8 ring-sky-500'} aspect-[2/3] sm:aspect-[3/2] col-span-3 row-span-2`,
}
