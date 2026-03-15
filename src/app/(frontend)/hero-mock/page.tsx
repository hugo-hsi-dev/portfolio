import { getPayload } from 'payload'
import config from '@payload-config'
import { getHomepageData } from '@/lib/getHomepageData'
import { Navigation } from '@/components/navigation/Navigation'
import { HeroSectionMock } from '@/components/home/HeroSectionMock'
import { ProjectsSection } from '@/components/home/ProjectsSection'
import { ExperienceSection } from '@/components/home/ExperienceSection'
import { EducationSection } from '@/components/home/EducationSection'
import { TechStackSection } from '@/components/home/TechStackSection'
import { LabSection } from '@/components/home/LabSection'
import { FooterSection } from '@/components/home/FooterSection'

export default async function HeroMockPage() {
  const payload = await getPayload({ config })

  const { homepage, featuredProjects, experiences, education, technologies, lab, contact } =
    await getHomepageData(payload)

  if (!homepage) {
    return (
      <div className="min-h-screen bg-[#f8f6f1] text-[#1a1a1a] flex items-center justify-center">
        <p className="text-gray-500">Homepage content not found. Please configure in CMS.</p>
      </div>
    )
  }

  const resumeUrl =
    typeof homepage.resume === 'object' && homepage.resume !== null ? homepage.resume.url : null

  const mockedHero = {
    firstName: homepage.hero?.firstName,
    lastName: homepage.hero?.lastName,
    tagline: 'Engineering products from design to database.',
    intro: {
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            version: 1,
            children: [
              {
                type: 'text',
                version: 1,
                text: 'Software engineer specializing in React, Next.js, and Node.js. I bring hands-on agency experience working directly with clients to deliver thoughtfully engineered applications.',
                format: '',
              },
            ],
            direction: 'ltr' as const,
            format: '' as const,
            indent: 0,
          },
        ],
        direction: 'ltr' as const,
        format: '' as const,
        indent: 0,
        version: 1,
      },
    },
    ctaPrimary: homepage.hero?.ctaPrimary,
    ctaSecondary: homepage.hero?.ctaSecondary,
    quote:
      "Beyond the keyboard, I'm a badminton coach, an avid gamer, and an active proponent of taking a proper break to do absolutely nothing.",
  }

  return (
    <div className="min-h-screen bg-[#f8f6f1] text-[#1a1a1a] overflow-x-hidden">
      <Navigation
        githubUrl={contact?.github ?? undefined}
        linkedinUrl={contact?.linkedin ?? undefined}
      />
      <HeroSectionMock hero={mockedHero} resumeUrl={resumeUrl} />
      <ProjectsSection projects={featuredProjects} />
      <ExperienceSection experiences={experiences} />
      <EducationSection education={education} />
      <TechStackSection technologies={technologies} />
      <LabSection lab={lab} />
      <FooterSection
        email={contact?.email}
        githubUrl={contact?.github}
        linkedinUrl={contact?.linkedin}
      />
    </div>
  )
}
