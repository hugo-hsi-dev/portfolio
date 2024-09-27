'use client'

import { cn } from '@/lib/classNameMerge'
import { motion } from 'framer-motion'
import { ComponentProps } from 'react'

type ButtonProps = ComponentProps<typeof motion.button>

export default function Button({ className, ...props }: ButtonProps) {
  return <motion.button whileHover="hovered" className={cn('relative', className)} {...props} />
}

type ButtonBackgroundProps = ComponentProps<typeof motion.div>

export function ButtonBackground({ className, style, ...props }: ButtonBackgroundProps) {
  return (
    <motion.div
      className={cn('absolute left-0 top-0 right-0 bottom-0 bg-white', className)}
      style={{ borderRadius: 24, ...style }}
      variants={{ hovered: { scale: 1.1 } }}
      {...props}
    />
  )
}

type ButtonContentProps = ComponentProps<'span'>

export function ButtonContent({ className, ...props }: ButtonContentProps) {
  return (
    <span
      className={cn(
        'relative z-10 px-6 py-6 flex gap-2 justify-center items-center font-medium',
        className,
      )}
      {...props}
    />
  )
}
