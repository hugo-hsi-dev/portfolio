'use client'

import { liVariants } from '@/components/block/blockTypes/contact/variants'
import { motion } from 'framer-motion'
import { PropsWithChildren } from 'react'

type ContactExpandedButtonProps = PropsWithChildren

export default function ContactExpandedItem({ children }: ContactExpandedButtonProps) {
  return (
    <motion.li className="flex gap-12 items-center" variants={liVariants}>
      {children}
    </motion.li>
  )
}
