import type { GlobalConfig } from 'payload'

export const About: GlobalConfig = {
  slug: 'about',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
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
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Professional photo - helps recruiters put a face to the name',
      },
    },
    {
      name: 'resume',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'skills',
      type: 'array',
      fields: [
        {
          name: 'category',
          type: 'text',
          required: true,
        },
        {
          name: 'items',
          type: 'array',
          fields: [
            {
              name: 'name',
              type: 'text',
              required: true,
            },
          ],
        },
      ],
    },
  ],
}
