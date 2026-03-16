'use client'

import { GithubLogo, LinkedinLogo } from '@phosphor-icons/react'
import { MagneticButton } from '@/components/motion/MouseEffects'
import { motion } from 'motion/react'
import { useState, useEffect } from 'react'

interface NavigationProps {
  githubUrl?: string
  linkedinUrl?: string
}

export function Navigation({ githubUrl, linkedinUrl }: NavigationProps) {
  const [showName, setShowName] = useState(false)

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
    <nav className="fixed top-0 left-0 right-0 z-50 mix-blend-difference">
      <div className="flex justify-between items-center pl-8 pr-6 lg:px-12 py-6">
        <MagneticButton
          href="#"
          className="font-serif text-xl tracking-tight text-white"
          intensity={0.2}
        >
          <motion.span
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: showName ? 1 : 0, y: showName ? 0 : -5 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            Hugo Hsi
          </motion.span>
        </MagneticButton>
        <div className="flex items-center gap-6">
          {githubUrl && (
            <MagneticButton
              href={githubUrl}
              className="text-white/80 hover:text-white transition-colors"
              intensity={0.3}
            >
              <GithubLogo size={20} />
            </MagneticButton>
          )}
          {linkedinUrl && (
            <MagneticButton
              href={linkedinUrl}
              className="text-white/80 hover:text-white transition-colors"
              intensity={0.3}
            >
              <LinkedinLogo size={20} />
            </MagneticButton>
          )}
        </div>
      </div>
    </nav>
  )
}
