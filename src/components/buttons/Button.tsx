'use client'

import { cn } from '@/lib/classNameMerge'
import { motion } from 'framer-motion'
import React, { ComponentProps } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

type ButtonProps = ComponentProps<typeof motion.button>

const buttonBackgroundVariants = cva('', {
  variants: {
    color: {
      sky: '',
    },
  },
})

const buttonTextVariants = cva('', {
  variants: {
    weight: {
      normal: 'font-normal',
      bold: 'font-bold',
    },
  },
})

export default function Button({ children, layoutId, className, ...props }: ButtonProps) {
  return (
    <motion.button className="relative p-2" {...props} whileHover={'hovered'}>
      <motion.div className="relative text-white font-bold z-20">{children}</motion.div>
      <motion.div
        className={cn('absolute left-0 top-0 right-0 bottom-0 bg-fuchsia-500 z-10', className)}
        variants={{ hovered: { scale: 1.2 } }}
        style={{ borderRadius: 12 }}
        layoutId={layoutId}
      />
    </motion.button>
  )
}
