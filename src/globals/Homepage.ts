import type { GlobalConfig } from 'payload'

export const Homepage: GlobalConfig = {
  slug: 'homepage',
  fields: [
    {
      name: 'hero',
      type: 'group',
      fields: [
        {
          name: 'firstName',
          type: 'text',
          required: true,
          admin: {
            description: 'First name for animated headline (e.g., "Hugo")',
          },
        },
        {
          name: 'lastName',
          type: 'text',
          required: true,
          admin: {
            description: 'Last name for animated headline (e.g., "Hsi")',
          },
        },
        {
          name: 'role',
          type: 'text',
          required: true,
          admin: {
            description: 'Job title (e.g., "Full-Stack Developer")',
          },
        },
        {
          name: 'tagline',
          type: 'text',
          required: true,
          admin: {
            description:
              'Typewriter text below name (e.g., "Full-stack developer with a designer\'s eye.")',
          },
        },
        {
          name: 'intro',
          type: 'richText',
          admin: {
            description: "Bio paragraph. Keep it short - recruiters scan, they don't read.",
          },
        },
        {
          name: 'ctaPrimary',
          type: 'group',
          fields: [
            {
              name: 'text',
              type: 'text',
              required: true,
              admin: {
                description: 'Primary CTA button text',
              },
            },
            {
              name: 'link',
              type: 'text',
              required: true,
              admin: {
                description: 'Link for primary CTA (e.g., "#projects")',
              },
            },
          ],
        },
        {
          name: 'ctaSecondary',
          type: 'group',
          fields: [
            {
              name: 'text',
              type: 'text',
              required: true,
              admin: {
                description: 'Secondary CTA button text (e.g., "Download resume")',
              },
            },
          ],
        },
        {
          name: 'quote',
          type: 'textarea',
          admin: {
            description: 'Designer quote displayed alongside hero content',
          },
        },
      ],
    },
    {
      name: 'resume',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Resume/CV PDF - this is a primary CTA for recruiters',
      },
    },
  ],
}
