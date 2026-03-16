'use client'

import { ScrollReveal } from '@/components/motion/ScrollReveal'
import { StaggerContainer, StaggerItem } from '@/components/motion/StaggerContainer'
import { LabCard } from '@/components/ui/LabCard'

interface LabSectionProps {
  lab: Array<{
    id: number
    name: string
    description: string
    technologies: string
    githubUrl?: string | null
  }>
}

export function LabSection({ lab }: LabSectionProps) {
  if (!lab || lab.length === 0) return null

  return (
    <section className="py-24 lg:py-32 pl-8 pr-6 lg:px-12 bg-cream-light">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal className="flex items-baseline justify-between mb-12">
          <h2 className="font-serif text-4xl lg:text-5xl tracking-tight">Lab</h2>
          <span className="font-sans text-xs uppercase tracking-[0.2em] text-stone">
            Experiments & Learning
          </span>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lab.map((item) => (
            <StaggerItem key={item.id}>
              <LabCard lab={item} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
