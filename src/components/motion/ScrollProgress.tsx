'use client'

import { LazyMotion, m, useScroll, useSpring, domAnimation } from 'motion/react'
import { useReducedMotion } from './ReducedMotionProvider'

export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const { shouldReduceMotion } = useReducedMotion()

  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  if (shouldReduceMotion) {
    return null
  }

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        className="fixed left-2 lg:left-6 top-0 bottom-0 w-[2px] bg-cream-lighter origin-top z-40"
        style={{ scaleY }}
      >
        <m.div className="absolute inset-0 bg-gold" style={{ scaleY }} />
      </m.div>
    </LazyMotion>
  )
}
