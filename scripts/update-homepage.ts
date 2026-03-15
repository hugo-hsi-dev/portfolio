import { getPayload } from 'payload'
import config from '../src/payload.config.js'

async function updateHomepage() {
  const p = await getPayload({ config })

  const updatedHero = {
    firstName: 'Hugo',
    lastName: 'Hsi',
    role: 'FULL-STACK SOFTWARE ENGINEER',
    tagline: 'Engineering products from design to database.',
    intro: {
      root: {
        type: 'root',
        format: '' as const,
        indent: 0,
        version: 1,
        children: [
          {
            type: 'paragraph',
            version: 1,
            children: [
              {
                text: 'Software engineer specializing in React, Next.js, and Node.js. I bring hands-on agency experience from Praxis Loop, where I shipped client work ranging from complex headless CMS integrations to pixel-perfect Figma implementations.',
                type: 'text',
                version: 1,
              },
            ],
          },
        ],
        direction: 'ltr' as const,
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
      "Beyond the keyboard, I'm a badminton coach, an avid gamer, and an active proponent of taking a proper break to do absolutely nothing.",
  }

  try {
    const result = await p.updateGlobal({
      slug: 'homepage',
      data: {
        hero: updatedHero,
      },
    })
    console.log('Successfully updated homepage content!')
  } catch (error) {
    console.error('Error updating homepage:', error)
  }

  process.exit(0)
}

updateHomepage()
