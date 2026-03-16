import dotenv from 'dotenv'
dotenv.config({ path: '.env' })

import { getPayload } from 'payload'
import config from '@payload-config'

async function updateHomepage() {
  const p = await getPayload({ config })

  const updatedHero = {
    firstName: 'Hugo',
    lastName: 'Hsi',
    tagline: 'Engineering products from design to database.',
    intro:
      'Software engineer specializing in React, Next.js, and Node.js. I bring hands-on agency experience working directly with clients to deliver thoughtfully engineered applications.',
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
