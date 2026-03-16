'use client'

import { motion, useMotionValue, useSpring } from 'motion/react'
import { useRef, ReactNode, useCallback } from 'react'

interface MagneticButtonProps {
  children: ReactNode
  className?: string
  href?: string
  intensity?: number
}

export function MagneticButton({
  children,
  className = '',
  href,
  intensity = 0.3,
}: MagneticButtonProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rafRef = useRef<number>(0)

  const springConfig = { damping: 15, stiffness: 150 }
  const springX = useSpring(x, springConfig)
  const springY = useSpring(y, springConfig)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return

      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        const rect = ref.current!.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        x.set((e.clientX - centerX) * intensity)
        y.set((e.clientY - centerY) * intensity)
      })
    },
    [x, y, intensity],
  )

  const handleMouseLeave = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    x.set(0)
    y.set(0)
  }, [x, y])

  const isExternal = href?.startsWith('http://') || href?.startsWith('https://')
  const target = isExternal ? '_blank' : '_self'

  const content = (
    <motion.span
      ref={ref}
      className={`inline-block ${className}`}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.span>
  )

  if (href) {
    return (
      <a href={href} target={target} rel={isExternal ? 'noopener noreferrer' : undefined}>
        {content}
      </a>
    )
  }

  return content
}
