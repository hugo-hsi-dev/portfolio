import type { CollectionConfig } from 'payload'

export const Projects: CollectionConfig = {
  slug: 'projects',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'text',
      required: true,
    },
    {
      name: 'stack',
      type: 'array',
      fields: [
        {
          name: 'technology',
          type: 'relationship',
          relationTo: 'skills',
        },
      ],
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: true,
      required: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        condition: (data) => {
          if (data.featured) {
            return true
          }
          return false
        },
      },
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
      admin: {
        condition: (data) => {
          if (data.featured) {
            return true
          }
          return false
        },
      },
    },
    {
      name: 'links',
      type: 'group',
      fields: [
        {
          name: 'githubUrl',
          type: 'text',
          required: true,
        },
        {
          name: 'externalUrl',
          type: 'text',
        },
      ],
    },
  ],
}
