'use client'

import { ScrollReveal } from '@/components/motion/ScrollReveal'

interface ExperienceSectionProps {
  experiences: Array<{
    id: number
    company: string
    role: string
    startDate: string
    endDate?: string | null | undefined
    isCurrent?: boolean | null | undefined
    description?: any
  }>
}

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return 'Present'
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric' })
}

export function ExperienceSection({ experiences }: ExperienceSectionProps) {
  if (!experiences || experiences.length === 0) return null

  const firstExperience = experiences[0]

  return (
    <section className="py-24 lg:py-32 pl-8 pr-6 lg:px-12 bg-[#1a1a1a] text-[#f8f6f1]">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div>
            <span className="font-sans text-xs uppercase tracking-[0.3em] text-[#8b8680] mb-6 block">
              Experience
            </span>
            <h3 className="font-serif text-2xl lg:text-3xl mb-4">{firstExperience.role}</h3>
            <p className="font-sans text-lg text-[#c4a35a] mb-2">{firstExperience.company}</p>
            <p className="font-sans text-sm text-[#8b8680] mb-4">
              {formatDate(firstExperience.startDate)} — {formatDate(firstExperience.endDate)}
            </p>
            {firstExperience.description && typeof firstExperience.description === 'string' && (
              <p className="font-sans text-[#b8b4ab] leading-relaxed text-pretty">
                {firstExperience.description}
              </p>
            )}
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
