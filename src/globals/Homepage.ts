import type { GlobalConfig } from 'payload'

export const Homepage: GlobalConfig = {
  slug: 'homepage',
  fields: [
    {
      name: 'hero',
      type: 'group',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          admin: {
            description: "Main headline (e.g., 'Hi, I\\'m Hugo')",
          },
        },
        {
          name: 'subtitle',
          type: 'textarea',
          required: true,
          admin: {
            description: 'Tagline (e.g., "Full-stack developer building things that matter")',
          },
        },
        {
          name: 'intro',
          type: 'richText',
          admin: {
            description: "Brief intro paragraph. Keep it short - recruiters scan, they don't read.",
          },
        },
        {
          name: 'ctaText',
          type: 'text',
        },
        {
          name: 'ctaLink',
          type: 'text',
        },
      ],
    },
    {
      name: 'featuredProjects',
      type: 'relationship',
      relationTo: 'projects',
      hasMany: true,
      minRows: 1,
      maxRows: 3,
      admin: {
        description: 'Select 3 of your best projects to feature on the homepage',
      },
    },
    {
      name: 'skills',
      type: 'group',
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'technologies',
          type: 'relationship',
          relationTo: 'technologies',
          hasMany: true,
        },
      ],
    },
    {
      name: 'resume',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description: 'Resume/CV PDF - this is a primary CTA for recruiters',
      },
    },
  ],
}
