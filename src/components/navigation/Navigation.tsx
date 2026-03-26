'use client'

import { GithubLogo, LinkedinLogo } from '@phosphor-icons/react'
import { MagneticButton } from '@/components/motion/MouseEffects'
import { LazyMotion, m, domAnimation } from 'motion/react'
import { useState, useEffect } from 'react'
import { useReducedMotion } from '@/components/motion/ReducedMotionProvider'

interface NavigationProps {
  githubUrl?: string
  linkedinUrl?: string
}

export function Navigation({ githubUrl, linkedinUrl }: NavigationProps) {
  const [showName, setShowName] = useState(false)
  const { shouldReduceMotion } = useReducedMotion()

  useEffect(() => {
    const eyebrow = document.getElementById('hero-eyebrow')
    if (!eyebrow) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowName(!entry.isIntersecting)
      },
      {
        threshold: 0,
        rootMargin: '0px 0px 0px 0px',
      },
    )

    observer.observe(eyebrow)
    return () => observer.disconnect()
  }, [])

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 mix-blend-difference"
      aria-label="Main navigation"
    >
      <div className="flex justify-between items-center pl-8 pr-6 lg:px-12 py-6">
        <MagneticButton
          href="#"
          aria-label="Scroll to top"
          className="font-serif text-xl tracking-tight text-white"
          intensity={0.2}
        >
          <LazyMotion features={domAnimation}>
            <m.span
              initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -5 }}
              animate={{ opacity: showName ? 1 : 0, y: showName ? 0 : -5 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              Hugo Hsi
            </m.span>
          </LazyMotion>
        </MagneticButton>
        <div className="flex items-center gap-6">
          {githubUrl && (
            <MagneticButton
              href={githubUrl}
              className="text-white/80 hover:text-white transition-colors"
              intensity={0.3}
              aria-label="GitHub Profile"
            >
              <GithubLogo size={20} />
            </MagneticButton>
          )}
          {linkedinUrl && (
            <MagneticButton
              href={linkedinUrl}
              className="text-white/80 hover:text-white transition-colors"
              intensity={0.3}
              aria-label="LinkedIn Profile"
            >
              <LinkedinLogo size={20} />
            </MagneticButton>
          )}
        </div>
      </div>
    </nav>
  )
}
