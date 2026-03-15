import type { CollectionConfig } from 'payload'

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['featured', 'order'],
    listSearchableFields: ['title', 'excerpt'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'excerpt',
      type: 'text',
      required: true,
      admin: {
        description: 'One-liner for project cards (keep it punchy)',
      },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'liveUrl',
      type: 'text',
      admin: {
        description: 'URL to the live project/demo',
      },
    },
    {
      name: 'sourceUrl',
      type: 'text',
      admin: {
        description: 'URL to source code (GitHub, GitLab, etc.)',
      },
    },
    {
      name: 'technologies',
      type: 'relationship',
      relationTo: 'technologies',
      hasMany: true,
    },
    {
      name: 'context',
      type: 'select',
      options: [
        { label: 'Personal Project', value: 'personal' },
        { label: 'Work Project', value: 'work' },
        { label: 'Learning Exercise', value: 'learning' },
        { label: 'Open Source Contribution', value: 'opensource' },
      ],
      admin: {
        description:
          'Tells recruiters where this project came from without them navigating to Experience',
      },
    },
    {
      name: 'company',
      type: 'text',
      admin: {
        description: 'If work project, which company? (shown alongside context)',
        condition: (data) => data?.context === 'work',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Featured projects appear on the homepage and get priority placement',
      },
    },
    {
      name: 'order',
      type: 'number',
      admin: {
        description: 'Display order (lower numbers appear first)',
      },
    },
  ],
  timestamps: true,
}
