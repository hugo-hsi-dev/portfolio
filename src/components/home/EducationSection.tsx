'use client'

import { ScrollReveal } from '@/components/motion/ScrollReveal'

interface EducationSectionProps {
  education: Array<{
    id: number
    institution: string
    degree: string
    fieldOfStudy: string
    startDate: string
    endDate?: string | null
    description?: any
  }>
}

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return 'Present'
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric' })
}

export function EducationSection({ education }: EducationSectionProps) {
  if (!education || education.length === 0) return null

  const firstEducation = education[0]

  return (
    <section className="py-24 lg:py-32 px-6 lg:px-12 bg-[#1a1a1a] text-[#f8f6f1] border-t border-[#333]">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal delay={0.1}>
          <div>
            <span className="font-sans text-xs uppercase tracking-[0.3em] text-[#8b8680] mb-6 block">
              Education
            </span>
            <h3 className="font-serif text-2xl lg:text-3xl mb-4">{firstEducation.degree}</h3>
            <p className="font-sans text-lg text-[#c4a35a] mb-2">{firstEducation.institution}</p>
            <p className="font-sans text-sm text-[#8b8680] mb-4">
              {formatDate(firstEducation.startDate)} — {formatDate(firstEducation.endDate)}
            </p>
            {firstEducation.description && typeof firstEducation.description === 'string' && (
              <p className="font-sans text-[#b8b4ab] leading-relaxed">
                {firstEducation.description}
              </p>
            )}
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
