'use client'

import { cn } from '@/lib/classNameMerge'
import { motion } from 'framer-motion'
import React, { ComponentProps } from 'react'

type ButtonProps = ComponentProps<typeof motion.div>

export default function Button({ children, className, ...props }: ButtonProps) {
  return (
    <motion.button className="relative p-2" whileHover={'hovered'}>
      <motion.div className="text-white font-bold">{children}</motion.div>
      <motion.div
        className={cn('absolute left-0 top-0 right-0 bottom-0 bg-fuchsia-500 -z-10', className)}
        variants={{ hovered: { scale: 1.2 } }}
        style={{ borderRadius: 12 }}
        {...props}
      />
    </motion.button>
  )
}
