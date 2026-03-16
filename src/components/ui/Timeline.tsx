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
  showTopBorder?: boolean
}

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return 'Present'
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric' })
}

export function Timeline({ items, header, showTopBorder = false }: TimelineProps) {
  if (!items || items.length === 0) return null

  return (
    <section
      className={`py-24 lg:py-32 pl-8 pr-6 lg:px-12 bg-charcoal text-cream ${showTopBorder ? 'border-t border-border' : ''}`}
    >
      <div className="max-w-6xl mx-auto">
        {header && (
          <header className="flex items-baseline justify-between mb-16">
            <h2 className="font-serif text-4xl lg:text-5xl tracking-tight">{header.label}</h2>
            <span className="font-sans text-xs uppercase tracking-[0.2em] text-stone">
              {header.count} item{header.count !== 1 ? 's' : ''}
            </span>
          </header>
        )}

        <div className="relative">
          <div className="absolute left-[19px] top-2 bottom-2 w-[1px] bg-border" />

          <div className="space-y-16">
            {items.map((item, index) => (
              <ScrollReveal key={item.id} delay={index * 0.1}>
                <div className="relative pl-12">
                  <div className="absolute left-[-5px] top-[7px] w-[3px] h-[3px] bg-stone rounded-full" />

                  <div className="mb-2">
                    <span className="font-sans text-xs uppercase tracking-[0.2em] text-stone">
                      {formatDate(item.startDate)} — {formatDate(item.endDate)}
                    </span>
                  </div>

                  <h3 className="font-serif text-xl lg:text-2xl mb-1">{item.title}</h3>

                  <p className="font-sans text-base text-gold mb-3">{item.subtitle}</p>

                  {item.description && (
                    <p className="font-sans text-stone-light leading-relaxed text-pretty">
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
