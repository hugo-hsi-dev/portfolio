'use client'

import { LazyMotion, m, useInView, domAnimation } from 'motion/react'
import { useRef, ReactNode } from 'react'
import { useReducedMotion } from './ReducedMotionProvider'

interface ScrollRevealProps {
  children: ReactNode
  className?: string
  delay?: number
}

export function ScrollReveal({ children, className = '', delay = 0 }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.1 })
  const { shouldReduceMotion } = useReducedMotion()

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        ref={ref}
        className={className}
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 40 }}
        animate={isInView || shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
        transition={{
          duration: 0.6,
          delay,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
      >
        {children}
      </m.div>
    </LazyMotion>
  )
}
