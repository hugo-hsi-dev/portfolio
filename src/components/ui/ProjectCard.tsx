'use client'

import { ArrowSquareOut } from '@phosphor-icons/react'
import { StaggerContainer, StaggerItem } from '@/components/motion/StaggerContainer'
import { AnimatedUnderline } from '@/components/ui/AnimatedUnderline'

interface ProjectCardProps {
  project: {
    id: number
    title: string
    excerpt: string
    description?: any
    featuredImage: any
    technologies?: any[]
    context?: string
    company?: string
    liveUrl?: string | null
  }
}

function ImageLift({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`relative overflow-hidden ${className} group`}>
      <div className="h-full w-full transition-transform duration-400 lg:group-hover:scale-102">
        {children}
      </div>
    </div>
  )
}

export function ProjectCard({ project }: ProjectCardProps) {
  const hasLink = Boolean(project.liveUrl)
  const Wrapper = hasLink ? 'a' : 'div'
  const wrapperProps = hasLink
    ? { href: project.liveUrl!, target: '_blank' as const, rel: 'noopener noreferrer' }
    : {}

  const featuredBg = project.context === 'work' ? 'bg-cream-lighter' : 'bg-cream-light'
  const categoryColor = project.context === 'work' ? 'text-gold' : 'text-sage'
  const categoryLabel =
    project.context === 'work'
      ? `Client Work at ${project.company || 'Company'}`
      : project.context === 'personal'
        ? 'Personal Project'
        : 'Project'

  const imageUrl =
    typeof project.featuredImage === 'object' && project.featuredImage !== null
      ? project.featuredImage.url
      : null

  return (
    <article className="group lg:hover:-translate-y-1 lg:hover:shadow-lg max-lg:active:scale-[0.98] transition-all duration-300 ease-out">
      <Wrapper {...wrapperProps} className="block">
        <StaggerContainer className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          <StaggerItem className="lg:col-span-7">
            <ImageLift className={`${featuredBg} ring-1 ring-black/[0.08]`}>
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={
                    typeof project.featuredImage === 'object' &&
                    project.featuredImage !== null &&
                    project.featuredImage.alt
                      ? project.featuredImage.alt
                      : project.title
                  }
                  className="h-auto w-full"
                />
              ) : (
                <div className="aspect-video flex items-center justify-center text-stone-light font-serif text-lg">
                  {project.title}
                </div>
              )}
            </ImageLift>
          </StaggerItem>
          <StaggerItem className="lg:col-span-5 lg:pt-4">
            <span
              className={`font-sans text-xs uppercase tracking-[0.2em] ${categoryColor} mb-3 block`}
            >
              {categoryLabel}
            </span>
            <h3 className="font-serif text-2xl lg:text-3xl mb-3">{project.title}</h3>
            <p className="font-sans text-slate mb-4 leading-relaxed">{project.excerpt}</p>
            {project.technologies && project.technologies.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {project.technologies.map((tech: any) => (
                  <span
                    key={tech.id}
                    className="font-sans text-xs px-2 py-1 bg-cream-lighter text-slate"
                  >
                    {typeof tech === 'string' ? tech : tech.name}
                  </span>
                ))}
              </div>
            )}
            {hasLink && (
              <span className="inline-flex items-center gap-1 font-sans text-sm text-charcoal group-hover:gap-2 transition-all">
                <AnimatedUnderline>Visit site</AnimatedUnderline>
                <ArrowSquareOut size={14} />
              </span>
            )}
          </StaggerItem>
        </StaggerContainer>
      </Wrapper>
    </article>
  )
}
