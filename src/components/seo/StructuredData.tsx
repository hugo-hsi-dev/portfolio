import { getPayload } from 'payload'
import config from '@payload-config'
import type { Project } from '@/payload-types'

export async function StructuredData() {
  const payload = await getPayload({ config })
  const [contact, homepage, featuredProjects] = await Promise.all([
    payload.findGlobal({ slug: 'contact', depth: 0 }),
    payload.findGlobal({ slug: 'homepage', depth: 0 }),
    payload.find({ collection: 'projects', sort: 'order', limit: 3, depth: 0 }).catch(() => null),
  ])

  const baseUrl = 'https://www.hugohsi.dev'

  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Hugo Hsi',
    jobTitle: 'Full-Stack Developer',
    email: contact?.email || 'hugohsidev@gmail.com',
    url: baseUrl,
    sameAs: [
      contact?.github || 'https://github.com/hugo-hsi-dev',
      contact?.linkedin || 'https://www.linkedin.com/in/hugo-hsi/',
    ],
    knowsAbout: [
      'React',
      'Next.js',
      'TypeScript',
      'Node.js',
      'PostgreSQL',
      'MongoDB',
      'Docker',
      'Tailwind CSS',
    ],
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Hugo Hsi Portfolio',
    url: baseUrl,
    description: homepage?.hero?.tagline || 'Full-Stack Developer Portfolio',
  }

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Hugo Hsi | Full-Stack Developer',
    url: baseUrl,
    description:
      homepage?.hero?.intro ||
      'Full-stack developer specializing in React, Next.js, and Node.js. NYC-based and open to remote opportunities with hands-on agency experience delivering thoughtfully engineered applications.',
    author: {
      '@type': 'Person',
      name: 'Hugo Hsi',
      url: baseUrl,
    },
  }

  const schemas: Record<string, unknown>[] = [personSchema, websiteSchema, webPageSchema]

  if (featuredProjects?.docs && featuredProjects.docs.length > 0) {
    const itemListSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Selected Projects',
      itemListElement: featuredProjects.docs.map((project: Project, index: number) => {
        const technologies = Array.isArray(project.technologies)
          ? project.technologies
              .map((t) => (typeof t === 'object' && t !== null ? t.name : String(t)))
              .filter(Boolean)
          : []

        return {
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'CreativeWork',
            name: project.title,
            description: project.excerpt,
            url: project.liveUrl,
            keywords: technologies,
          },
        }
      }),
    }
    schemas.push(itemListSchema)
  }

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  )
}
