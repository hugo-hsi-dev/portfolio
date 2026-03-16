'use client'

import { AnimatedUnderline } from '@/components/ui/AnimatedUnderline'

interface SocialLinksProps {
  githubUrl?: string | null | undefined
  linkedinUrl?: string | null | undefined
  email?: string | null | undefined
  className?: string
}

export function SocialLinks({ githubUrl, linkedinUrl, email, className = '' }: SocialLinksProps) {
  return (
    <div className={`flex gap-6 ${className}`}>
      {email && (
        <a
          href={`mailto:${email}`}
          className="font-sans text-sm text-stone hover:text-cream transition-colors"
        >
          <AnimatedUnderline>Email</AnimatedUnderline>
        </a>
      )}
      {githubUrl && (
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-sans text-sm text-stone hover:text-cream transition-colors"
        >
          <AnimatedUnderline>GitHub</AnimatedUnderline>
        </a>
      )}
      {linkedinUrl && (
        <a
          href={linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-sans text-sm text-stone hover:text-cream transition-colors"
        >
          <AnimatedUnderline>LinkedIn</AnimatedUnderline>
        </a>
      )}
    </div>
  )
}
