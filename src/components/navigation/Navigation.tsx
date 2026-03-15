'use client'

import { GithubLogo, LinkedinLogo } from '@phosphor-icons/react'
import { MagneticButton } from '@/components/motion/MouseEffects'

interface NavigationProps {
  siteName?: string
  githubUrl?: string
  linkedinUrl?: string
}

export function Navigation({ siteName = 'Hugo Hsi', githubUrl, linkedinUrl }: NavigationProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 mix-blend-difference">
      <div className="flex justify-between items-center pl-8 pr-6 lg:px-12 py-6">
        <MagneticButton
          href="#"
          className="font-serif text-xl tracking-tight text-white"
          intensity={0.2}
        >
          {siteName}
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
