'use client'

import { motion, useMotionValue, useSpring } from 'motion/react'
import { useEffect, useRef, ReactNode, useCallback } from 'react'

interface MouseFollowerProps {
  children: ReactNode
  className?: string
  intensity?: number
}

export function MouseFollower({ children, className = '', intensity = 0.1 }: MouseFollowerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springConfig = { damping: 25, stiffness: 150 }
  const x = useSpring(mouseX, springConfig)
  const y = useSpring(mouseY, springConfig)

  useEffect(() => {
    let rafId: number
    let lastX = 0
    let lastY = 0

    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current) return

      const rect = ref.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      const newX = (e.clientX - centerX) * intensity
      const newY = (e.clientY - centerY) * intensity

      // Only update if moved significantly
      if (Math.abs(newX - lastX) > 1 || Math.abs(newY - lastY) > 1) {
        cancelAnimationFrame(rafId)
        rafId = requestAnimationFrame(() => {
          mouseX.set(newX)
          mouseY.set(newY)
          lastX = newX
          lastY = newY
        })
      }
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(rafId)
    }
  }, [mouseX, mouseY, intensity])

  return (
    <motion.div ref={ref} className={className} style={{ x, y }}>
      {children}
    </motion.div>
  )
}

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

  const springConfig = { damping: 15, stiffness: 150 }
  const springX = useSpring(x, springConfig)
  const springY = useSpring(y, springConfig)

  let rafId: number

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return

      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
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
    cancelAnimationFrame(rafId)
    x.set(0)
    y.set(0)
  }, [x])

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
    return <a href={href}>{content}</a>
  }

  return content
}
