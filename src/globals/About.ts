import type { GlobalConfig } from 'payload'

export const About: GlobalConfig = {
  slug: 'about',
  fields: [
    {
      name: 'bio',
      type: 'richText',
      required: true,
      admin: {
        description:
          'Your story. Keep it relevant to your career - recruiters want to know who you are professionally.',
      },
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Professional photo - helps recruiters put a face to the name',
      },
    },
  ],
}
