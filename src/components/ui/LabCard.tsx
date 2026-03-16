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
  return (
    <a
      href={lab.githubUrl || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="group block p-6 bg-cream hover:bg-white transition-colors"
    >
      <h3 className="font-serif text-lg mb-2 group-hover:translate-x-1 transition-transform">
        {lab.name}
      </h3>
      <p className="font-sans text-sm text-slate mb-3">{lab.description}</p>
      <span className="font-sans text-xs text-stone">{lab.technologies}</span>
    </a>
  )
}
