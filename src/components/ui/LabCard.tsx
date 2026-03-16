'use client'

interface LabCardProps {
  lab: {
    id: number
    name: string
    description: string
    technologies: string
    githubUrl?: string | null
  }
}

export function LabCard({ lab }: LabCardProps) {
  const hasLink = Boolean(lab.githubUrl)
  const Wrapper = hasLink ? 'a' : 'div'
  const wrapperProps = hasLink
    ? { href: lab.githubUrl!, target: '_blank' as const, rel: 'noopener noreferrer' }
    : {}

  return (
    <Wrapper
      {...wrapperProps}
      className="group block p-6 bg-cream hover:bg-white transition-colors"
    >
      <h3 className="font-serif text-lg mb-2 group-hover:translate-x-1 transition-transform">
        {lab.name}
      </h3>
      <p className="font-sans text-sm text-slate mb-3">{lab.description}</p>
      <span className="font-sans text-xs text-stone">{lab.technologies}</span>
    </Wrapper>
  )
}
