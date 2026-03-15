'use client'

import { ScrollReveal } from '@/components/motion/ScrollReveal'

interface Technology {
  id: number
  name: string
}

interface TechStackSectionProps {
  technologies: {
    frontend?: Technology[]
    backend?: Technology[]
    database?: Technology[]
    devops?: Technology[]
    tools?: Technology[]
    languages?: Technology[]
  }
}

export function TechStackSection({ technologies }: TechStackSectionProps) {
  const categories = [
    { title: 'Frontend', items: technologies.frontend || [] },
    { title: 'Backend', items: technologies.backend || [] },
    { title: 'Database', items: technologies.database || [] },
    { title: 'Tools', items: technologies.tools || [] },
  ].filter((cat) => cat.items.length > 0)

  if (categories.length === 0) return null

  return (
    <section className="py-24 lg:py-32 px-6 lg:px-12">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal className="mb-16">
          <h2 className="font-serif text-4xl lg:text-5xl tracking-tight">Tech Stack</h2>
        </ScrollReveal>

        <ScrollReveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
            {categories.map((category) => (
              <div key={category.title}>
                <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-[#8b8680] mb-4">
                  {category.title}
                </h3>
                <ul className="font-sans text-base space-y-2">
                  {category.items.map((tech) => (
                    <li key={tech.id}>{tech.name}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
