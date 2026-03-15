import dotenv from 'dotenv'
dotenv.config({ path: '.env' })

import { getPayload } from 'payload'
import config from '@payload-config'

async function seed() {
  const payload = await getPayload({ config })

  console.log('🌱 Seeding CMS data...\n')

  // 1. Create Contact info
  console.log('Creating Contact info...')
  await payload.updateGlobal({
    slug: 'contact',
    data: {
      email: 'hello@hugohsi.dev',
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
    },
  })
  console.log('✓ Contact updated\n')

  // 2. Create Technologies (skip if exists)
  console.log('Creating Technologies...')
  const technologies = [
    { name: 'React', category: 'frontend' as const, order: 1 },
    { name: 'Next.js', category: 'frontend' as const, order: 2 },
    { name: 'Svelte', category: 'frontend' as const, order: 3 },
    { name: 'Tailwind CSS', category: 'frontend' as const, order: 4 },
    { name: 'Node.js', category: 'backend' as const, order: 1 },
    { name: 'TypeScript', category: 'backend' as const, order: 2 },
    { name: 'Express', category: 'backend' as const, order: 3 },
    { name: 'PostgreSQL', category: 'database' as const, order: 1 },
    { name: 'MongoDB', category: 'database' as const, order: 2 },
    { name: 'Redis', category: 'database' as const, order: 3 },
    { name: 'Git', category: 'tools' as const, order: 1 },
    { name: 'Figma', category: 'tools' as const, order: 2 },
    { name: 'Docker', category: 'tools' as const, order: 3 },
    { name: 'Payload CMS', category: 'tools' as const, order: 4 },
  ]

  let createdTechs = 0
  let skippedTechs = 0
  for (const tech of technologies) {
    try {
      const existing = await payload.find({
        collection: 'technologies',
        where: { name: { equals: tech.name } },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        skippedTechs++
        continue
      }

      await payload.create({
        collection: 'technologies',
        data: tech,
      })
      createdTechs++
    } catch (err) {
      console.log(`  ⚠️  Skipped ${tech.name} (already exists)`)
      skippedTechs++
    }
  }
  console.log(`✓ Technologies: ${createdTechs} created, ${skippedTechs} skipped\n`)

  // 3. Create Experience
  console.log('Creating Experience...')
  let experience
  try {
    const existing = await payload.find({
      collection: 'experience',
      where: { company: { equals: 'Praxis Loop' } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      experience = existing.docs[0]
      console.log('  ℹ️  Experience already exists, skipping\n')
    } else {
      experience = await payload.create({
        collection: 'experience',
        data: {
          company: 'Praxis Loop',
          role: 'Full-Stack Developer',
          startDate: '2023-01-01',
          isCurrent: true,
          order: 1,
        },
      })
      console.log('✓ Experience created\n')
    }
  } catch (err) {
    console.log('  ⚠️  Could not create experience\n')
  }

  // 4. Create Education
  console.log('Creating Education...')
  let education
  try {
    const existing = await payload.find({
      collection: 'education',
      where: { degree: { equals: 'BFA in Graphic Design' } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      education = existing.docs[0]
      console.log('  ℹ️  Education already exists, skipping\n')
    } else {
      education = await payload.create({
        collection: 'education',
        data: {
          institution: 'Your University',
          degree: 'BFA in Graphic Design',
          startDate: '2015-01-01',
          endDate: '2019-01-01',
        },
      })
      console.log('✓ Education created\n')
    }
  } catch (err) {
    console.log('  ⚠️  Could not create education\n')
  }

  // 5. Create Projects
  console.log('Creating Projects...')
  const projectData = [
    {
      title: 'National Medal of Honor Museum',
      excerpt:
        'Complete CMS migration from WordPress to Prismic. Migrated content architecture, rebuilt component library, and maintained SEO rankings throughout transition.',
      featured: true,
      context: 'work' as const,
      company: 'Praxis Loop',
      order: 1,
    },
    {
      title: '1st Avenue Advisors',
      excerpt:
        'Client-facing pages with pixel-perfect Figma-to-code implementation. Built working contact forms, dynamic content sections, and responsive layouts.',
      featured: true,
      context: 'work' as const,
      company: 'Praxis Loop',
      order: 2,
    },
    {
      title: 'Content API Platform',
      excerpt:
        'Full-stack API service with authentication, rate limiting, and webhook support. Demonstrates backend architecture and database design beyond frontend work.',
      featured: true,
      context: 'personal' as const,
      order: 3,
    },
  ]

  const createdProjects = []
  for (const project of projectData) {
    try {
      const existing = await payload.find({
        collection: 'projects',
        where: { title: { equals: project.title } },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        createdProjects.push(existing.docs[0])
        console.log(`  ℹ️  "${project.title}" already exists`)
      } else {
        const created = await payload.create({
          collection: 'projects',
          data: project,
        })
        createdProjects.push(created)
        console.log(`  ✓ Created "${project.title}"`)
      }
    } catch (err) {
      console.log(`  ⚠️  Could not create "${project.title}"`)
    }
  }
  console.log(`\n✓ Projects: ${createdProjects.length} total\n`)

  // 6. Create Lab items
  console.log('Creating Lab items...')
  const labItems = [
    {
      name: 'Rust CLI Tool',
      description: 'File processing utility built to learn Rust',
      technologies: 'Rust',
      githubUrl: '',
      featured: true,
      order: 1,
    },
    {
      name: 'Go API Server',
      description: 'REST API with middleware and auth',
      technologies: 'Go, PostgreSQL',
      githubUrl: '',
      featured: true,
      order: 2,
    },
    {
      name: 'Weather Dashboard',
      description: 'Real-time data visualization',
      technologies: 'React, D3.js',
      githubUrl: '',
      featured: true,
      order: 3,
    },
    {
      name: 'Portfolio v1',
      description: 'Previous iteration of this site',
      technologies: 'Next.js, MDX',
      githubUrl: '',
      featured: true,
      order: 4,
    },
    {
      name: 'Task Tracker',
      description: 'Local-first productivity app',
      technologies: 'Svelte, SQLite',
      githubUrl: '',
      featured: true,
      order: 5,
    },
    {
      name: 'Color Palette Gen',
      description: 'Algorithmic color scheme generator',
      technologies: 'TypeScript, Canvas',
      githubUrl: '',
      featured: true,
      order: 6,
    },
  ]

  let createdLabs = 0
  for (const item of labItems) {
    try {
      const existing = await payload.find({
        collection: 'lab',
        where: { name: { equals: item.name } },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        console.log(`  ℹ️  "${item.name}" already exists`)
      } else {
        await payload.create({
          collection: 'lab',
          data: item,
        })
        createdLabs++
        console.log(`  ✓ Created "${item.name}"`)
      }
    } catch (err) {
      console.log(`  ⚠️  Could not create "${item.name}"`)
    }
  }
  console.log(`\n✓ Lab items: ${createdLabs} created\n`)

  // 7. Create Homepage
  console.log('Creating Homepage...')
  const homepageData = {
    hero: {
      firstName: 'Hugo',
      lastName: 'Hsi',
      role: 'Full-Stack Developer',
      tagline: "Full-stack developer with a designer's eye.",
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
                  text: "Graphic design degree turned full-stack engineer. I ship production code with an understanding of why it's designed that way. Building with React, Next.js, TypeScript, and Node.js. Formerly shipping client work at Praxis Loop.",
                },
              ],
            },
          ],
          direction: null,
          format: '' as const,
          indent: 0,
          version: 1,
        },
      },
      ctaPrimary: {
        text: 'View my work',
        link: '#projects',
      },
      ctaSecondary: {
        text: 'Download resume',
      },
      quote:
        "My design training means I don't just build what's specced — I understand why it's specced that way.",
    },
  }

  await payload.updateGlobal({
    slug: 'homepage',
    data: homepageData,
  })
  console.log('✓ Homepage updated\n')

  console.log('✨ Seed complete! All content has been added to the CMS.')
  console.log('\n⚠️  IMPORTANT: You need to manually:')
  console.log('   1. Upload your resume PDF to the Homepage global')
  console.log('   2. Update project screenshots in the Media collection')
  console.log('   3. Update any URLs/links with your actual profiles')

  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
