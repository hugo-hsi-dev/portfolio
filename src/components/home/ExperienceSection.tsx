'use client'

import { Timeline, type TimelineItemData } from '@/components/ui/Timeline'

interface ExperienceSectionProps {
  experiences: Array<{
    id: number
    company: string
    role: string
    startDate: string
    endDate?: string | null
    isCurrent?: boolean | null
  }>
}

export function ExperienceSection({ experiences }: ExperienceSectionProps) {
  const timelineItems: TimelineItemData[] = experiences.map((exp) => ({
    id: exp.id,
    title: exp.role,
    subtitle: exp.company,
    startDate: exp.startDate,
    endDate: exp.isCurrent ? null : exp.endDate,
  }))

  return (
    <Timeline
      items={timelineItems}
      header={{
        label: 'Experience',
        count: experiences.length,
      }}
      showTopBorder={false}
      sectionBg="bg-[#1a1a1a]"
    />
  )
}
