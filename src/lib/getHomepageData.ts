import type { Experience, Education, Project, Technology, Homepage, Contact } from '@/payload-types'
import type { Payload } from 'payload'

export async function getHomepageData(payload: Payload) {
  const [homepage, featuredProjects, experiences, education, technologies, lab, contact] =
    await Promise.all([
      payload.findGlobal({ slug: 'homepage', depth: 1 }).catch(() => null),

      payload.find({
        collection: 'projects',
        sort: 'order',
        limit: 3,
        depth: 2,
      }),

      payload.find({
        collection: 'experience',
        sort: '-startDate',
      }),

      payload.find({
        collection: 'education',
        sort: '-startDate',
      }),

      payload.find({
        collection: 'technologies',
        sort: 'name',
      }),

      payload.find({
        collection: 'lab',
        where: {
          featured: { equals: true },
        },
        sort: 'order',
        limit: 6,
      }),

      payload.findGlobal({ slug: 'contact' }).catch(() => null),
    ])

  const homepageData = homepage as Homepage | null
  const projectsData = featuredProjects?.docs as Project[] | []
  const experiencesData = experiences?.docs as Experience[] | []
  const educationData = education?.docs as Education[] | []
  const technologiesData = technologies?.docs as Technology[] | []
  const labData = lab?.docs || []
  const contactData = contact as Contact | null

  const groupedTechs = {
    frontend: technologiesData.filter((t) => t.category === 'frontend'),
    backend: technologiesData.filter((t) => t.category === 'backend'),
    database: technologiesData.filter((t) => t.category === 'database'),
    tools: technologiesData.filter((t) => t.category === 'tools'),
  }

  return {
    homepage: homepageData,
    featuredProjects: projectsData,
    experiences: experiencesData,
    education: educationData,
    technologies: groupedTechs,
    lab: labData,
    contact: contactData,
  }
}
