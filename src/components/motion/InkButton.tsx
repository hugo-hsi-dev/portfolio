'use client'

import { motion } from 'motion/react'
import { ReactNode } from 'react'

interface InkButtonProps {
  children: ReactNode
  href: string
  className?: string
  variant?: 'solid' | 'outline'
}

export function InkButton({ children, href, className = '', variant = 'solid' }: InkButtonProps) {
  const isExternal = href.startsWith('http://') || href.startsWith('https://')
  const isPDF = href.toLowerCase().endsWith('.pdf')
  const target = isExternal || isPDF ? '_blank' : '_self'

  const baseClasses =
    variant === 'solid'
      ? 'inline-flex items-center gap-2 px-6 py-3 font-sans text-sm uppercase tracking-wider relative overflow-hidden bg-charcoal text-cream'
      : 'inline-flex items-center gap-2 px-6 py-3 font-sans text-sm uppercase tracking-wider relative overflow-hidden border border-charcoal text-charcoal'

  const content = (
    <motion.span className={`${baseClasses} ${className}`} whileHover="hover" initial="initial">
      <motion.span
        className={`absolute inset-0 ${variant === 'solid' ? 'bg-border' : 'bg-charcoal'}`}
        variants={{
          initial: { x: '-100%' },
          hover: { x: '0%' },
        }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      />
      <motion.span
        className="relative z-10 flex items-center gap-2"
        variants={{
          initial: { color: variant === 'solid' ? 'var(--color-cream)' : 'var(--color-charcoal)' },
          hover: { color: 'var(--color-cream)' },
        }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.span>
    </motion.span>
  )

  return (
    <a href={href} target={target} rel={isExternal ? 'noopener noreferrer' : undefined}>
      {content}
    </a>
  )
}
