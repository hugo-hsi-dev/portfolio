'use client'

import { Timeline, type TimelineItemData } from '@/components/ui/Timeline'

interface EducationSectionProps {
  education: Array<{
    id: number
    institution: string
    degree: string
    startDate: string
    endDate?: string | null
  }>
}

export function EducationSection({ education }: EducationSectionProps) {
  const timelineItems: TimelineItemData[] = education.map((edu) => ({
    id: edu.id,
    title: edu.degree,
    subtitle: edu.institution,
    startDate: edu.startDate,
    endDate: edu.endDate,
  }))

  return (
    <Timeline
      items={timelineItems}
      header={{
        label: 'Education',
        count: education.length,
      }}
      showTopBorder={true}
    />
  )
}
