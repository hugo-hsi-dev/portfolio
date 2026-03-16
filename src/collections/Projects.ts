import type { CollectionConfig } from 'payload'

export const Projects: CollectionConfig = {
  slug: 'projects',
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title'],
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
      name: 'order',
      type: 'number',
      admin: {
        description: 'Display order (lower numbers appear first)',
      },
    },
  ],
  timestamps: true,
}
