import { getPayload } from 'payload'
import config from '@payload-config'
import { getHomepageData } from '@/lib/getHomepageData'
import { Navigation } from '@/components/navigation/Navigation'
import { HeroSection } from '@/components/home/HeroSection'
import { ProjectsSection } from '@/components/home/ProjectsSection'
import { ExperienceSection } from '@/components/home/ExperienceSection'
import { EducationSection } from '@/components/home/EducationSection'
import { TechStackSection } from '@/components/home/TechStackSection'
import { LabSection } from '@/components/home/LabSection'
import { FooterSection } from '@/components/home/FooterSection'

export default async function HomePage() {
  const payload = await getPayload({ config })

  const { homepage, featuredProjects, experiences, education, technologies, lab, contact } =
    await getHomepageData(payload)

  if (!homepage) {
    return (
      <div className="min-h-screen bg-cream text-charcoal flex items-center justify-center">
        <p className="text-gray-500">Homepage content not found. Please configure in CMS.</p>
      </div>
    )
  }

  const resumeUrl =
    typeof homepage.resume === 'object' && homepage.resume !== null ? homepage.resume.url : null

  return (
    <div className="min-h-dvh overflow-x-hidden">
      <div className="bg-cream text-charcoal">
        <Navigation
          githubUrl={contact?.github ?? undefined}
          linkedinUrl={contact?.linkedin ?? undefined}
        />
        <HeroSection hero={homepage.hero} resumeUrl={resumeUrl} />
        <ProjectsSection projects={featuredProjects} />
        <ExperienceSection experiences={experiences} />
        <EducationSection education={education} />
        <TechStackSection technologies={technologies} />
        <LabSection lab={lab} />
      </div>
      <FooterSection
        email={contact?.email}
        githubUrl={contact?.github}
        linkedinUrl={contact?.linkedin}
      />
    </div>
  )
}
