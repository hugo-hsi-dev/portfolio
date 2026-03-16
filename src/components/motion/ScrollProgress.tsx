'use client'

import { motion, useScroll, useSpring } from 'motion/react'

export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  return (
    <motion.div
      className="fixed left-2 lg:left-6 top-0 bottom-0 w-[2px] bg-cream-lighter origin-top z-40"
      style={{ scaleY }}
    >
      <motion.div className="absolute inset-0 bg-gold" style={{ scaleY }} />
    </motion.div>
  )
}
