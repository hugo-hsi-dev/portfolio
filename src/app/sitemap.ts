import { getPayload } from 'payload'
import config from '@payload-config'
import { MetadataRoute } from 'next'

const baseUrl = 'https://www.hugohsi.dev'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayload({ config })

  const [homepage, contact, projects, experience, education, lab] = await Promise.all([
    payload.findGlobal({ slug: 'homepage' }).catch(() => null),
    payload.findGlobal({ slug: 'contact' }).catch(() => null),
    payload.find({ collection: 'projects', sort: '-updatedAt', limit: 1 }).catch(() => null),
    payload.find({ collection: 'experience', sort: '-updatedAt', limit: 1 }).catch(() => null),
    payload.find({ collection: 'education', sort: '-updatedAt', limit: 1 }).catch(() => null),
    payload.find({ collection: 'lab', sort: '-updatedAt', limit: 1 }).catch(() => null),
  ])

  const updatedAtDates: Date[] = []

  if (homepage && typeof homepage === 'object' && 'updatedAt' in homepage) {
    updatedAtDates.push(new Date(homepage.updatedAt as string))
  }
  if (contact && typeof contact === 'object' && 'updatedAt' in contact) {
    updatedAtDates.push(new Date(contact.updatedAt as string))
  }
  if (projects?.docs && projects.docs.length > 0) {
    const latestProject = projects.docs[0]
    if (latestProject && typeof latestProject === 'object' && 'updatedAt' in latestProject) {
      updatedAtDates.push(new Date(latestProject.updatedAt as string))
    }
  }
  if (experience?.docs && experience.docs.length > 0) {
    const latestExperience = experience.docs[0]
    if (
      latestExperience &&
      typeof latestExperience === 'object' &&
      'updatedAt' in latestExperience
    ) {
      updatedAtDates.push(new Date(latestExperience.updatedAt as string))
    }
  }
  if (education?.docs && education.docs.length > 0) {
    const latestEducation = education.docs[0]
    if (latestEducation && typeof latestEducation === 'object' && 'updatedAt' in latestEducation) {
      updatedAtDates.push(new Date(latestEducation.updatedAt as string))
    }
  }
  if (lab?.docs && lab.docs.length > 0) {
    const latestLab = lab.docs[0]
    if (latestLab && typeof latestLab === 'object' && 'updatedAt' in latestLab) {
      updatedAtDates.push(new Date(latestLab.updatedAt as string))
    }
  }

  const lastModified =
    updatedAtDates.length > 0
      ? new Date(Math.max(...updatedAtDates.map((d) => d.getTime())))
      : new Date()

  return [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]
}
