'use client'

import type { Project } from '@/payload-types'
import { ProjectCard } from '@/components/ui/ProjectCard'

interface ProjectsSectionProps {
  projects: Project[]
}

export function ProjectsSection({ projects }: ProjectsSectionProps) {
  if (!projects || projects.length === 0) return null

  return (
    <section id="projects" className="py-24 lg:py-32 pl-8 pr-6 lg:px-12">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-baseline justify-between mb-16">
          <h2 className="font-serif text-4xl lg:text-5xl tracking-tight">Selected Work</h2>
          <span className="font-sans text-xs uppercase tracking-[0.2em] text-stone">
            {projects.length} Project{projects.length !== 1 ? 's' : ''}
          </span>
        </header>

        <div className="space-y-20">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </section>
  )
}
