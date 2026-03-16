'use client'

interface SocialLinksProps {
  githubUrl?: string | null | undefined
  linkedinUrl?: string | null | undefined
  email?: string | null | undefined
  className?: string
}

function AnimatedUnderline({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-block group">
      <span className="relative">
        {children}
        <span className="absolute bottom-0 left-0 w-full h-[1px] bg-current origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
      </span>
    </span>
  )
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
