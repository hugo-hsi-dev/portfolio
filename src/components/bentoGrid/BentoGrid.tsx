'use client'

import { LayoutGroup, motion } from 'framer-motion'
import { PropsWithChildren } from 'react'
type BentoGridProps = PropsWithChildren

export default function BentoGrid({ children }: BentoGridProps) {
  return (
    <LayoutGroup>
      <motion.div className="grid grid-cols-3 grid-flow-dense gap-6" layout>
        {children}
      </motion.div>
    </LayoutGroup>
  )
}
