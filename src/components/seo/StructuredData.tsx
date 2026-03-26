import { getPayload } from 'payload'
import config from '@payload-config'

export async function StructuredData() {
  const payload = await getPayload({ config })
  const [contact, homepage] = await Promise.all([
    payload.findGlobal({ slug: 'contact', depth: 0 }),
    payload.findGlobal({ slug: 'homepage', depth: 0 }),
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
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  )
}
