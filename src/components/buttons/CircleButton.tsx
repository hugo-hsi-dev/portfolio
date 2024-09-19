'use client'

import { cn } from '@/lib/classNameMerge'
import { motion } from 'framer-motion'
import React, { ComponentProps } from 'react'

type CircleButtonProps = ComponentProps<typeof motion.div>

export default function CircleButton({ children, className, ...props }: CircleButtonProps) {
  return (
    <motion.button className="relative h-[50px] w-[50px]" whileHover={'hovered'}>
      <motion.div className="absolute top-1/2 left-1/2 -translate-y-2/4 -translate-x-2/4 text-white z-10">
        {children}
      </motion.div>
      <motion.div
        className={cn('absolute left-0 top-0 right-0 bottom-0 bg-fuchsia-500', className)}
        variants={{ hovered: { scale: 1.2 } }}
        style={{ borderRadius: 25 }}
        {...props}
      />
    </motion.button>
  )
}
