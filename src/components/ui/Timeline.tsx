'use client'

import { ScrollReveal } from '@/components/motion/ScrollReveal'

export interface TimelineItemData {
  id: number | string
  title: string
  subtitle: string
  startDate: string
  endDate?: string | null
  description?: string
}

interface TimelineProps {
  items: TimelineItemData[]
  header?: {
    label: string
    count?: number
  }
  sectionBg?: string
  showTopBorder?: boolean
}

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return 'Present'
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric' })
}

export function Timeline({
  items,
  header,
  sectionBg = 'bg-[#1a1a1a]',
  showTopBorder = false,
}: TimelineProps) {
  if (!items || items.length === 0) return null

  return (
    <section
      className={`py-24 lg:py-32 pl-8 pr-6 lg:px-12 ${sectionBg} text-[#f8f6f1] ${showTopBorder ? 'border-t border-[#333]' : ''}`}
    >
      <div className="max-w-6xl mx-auto">
        {header && (
          <header className="flex items-baseline justify-between mb-16">
            <h2 className="font-serif text-4xl lg:text-5xl tracking-tight">{header.label}</h2>
            <span className="font-sans text-xs uppercase tracking-[0.2em] text-[#8b8680]">
              {header.count} item{header.count !== 1 ? 's' : ''}
            </span>
          </header>
        )}

        <div className="relative">
          <div className="absolute left-[19px] top-2 bottom-2 w-[1px] bg-[#333]" />

          <div className="space-y-16">
            {items.map((item, index) => (
              <ScrollReveal key={item.id} delay={index * 0.1}>
                <div className="relative pl-12">
                  <div className="absolute left-[-5px] top-[7px] w-[3px] h-[3px] bg-[#8b8680] rounded-full" />

                  <div className="mb-2">
                    <span className="font-sans text-xs uppercase tracking-[0.2em] text-[#8b8680]">
                      {formatDate(item.startDate)} — {formatDate(item.endDate)}
                    </span>
                  </div>

                  <h3 className="font-serif text-xl lg:text-2xl mb-1">{item.title}</h3>

                  <p className="font-sans text-base text-[#c4a35a] mb-3">{item.subtitle}</p>

                  {item.description && (
                    <p className="font-sans text-[#b8b4ab] leading-relaxed text-pretty">
                      {item.description}
                    </p>
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
