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
      className="group block p-6 bg-[#f8f6f1] hover:bg-white transition-colors"
    >
      <h3 className="font-serif text-lg mb-2 group-hover:translate-x-1 transition-transform">
        {lab.name}
      </h3>
      <p className="font-sans text-sm text-[#5a5a5a] mb-3">{lab.description}</p>
      <span className="font-sans text-xs text-[#8b8680]">{lab.technologies}</span>
    </a>
  )
}
