'use client'

import { LazyMotion, m, useInView, domAnimation } from 'motion/react'
import { useRef, ReactNode } from 'react'
import { useReducedMotion } from './ReducedMotionProvider'

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
}

const reducedMotionContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0,
    },
  },
}

const reducedMotionItemVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.1,
    },
  },
}

export function StaggerContainer({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.1 })
  const { shouldReduceMotion } = useReducedMotion()

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        ref={ref}
        className={className}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        variants={shouldReduceMotion ? reducedMotionContainerVariants : containerVariants}
      >
        {children}
      </m.div>
    </LazyMotion>
  )
}

export function StaggerItem({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const { shouldReduceMotion } = useReducedMotion()

  return (
    <m.div
      className={className}
      variants={shouldReduceMotion ? reducedMotionItemVariants : itemVariants}
    >
      {children}
    </m.div>
  )
}
