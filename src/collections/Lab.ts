import type { CollectionConfig } from 'payload'

export const Lab: CollectionConfig = {
  slug: 'lab',
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'text',
      required: true,
      admin: {
        description: 'One-line description of the experiment',
      },
    },
    {
      name: 'technologies',
      type: 'text',
      required: true,
      admin: {
        description: 'Technologies used (e.g., "Rust" or "Go, PostgreSQL")',
      },
    },
    {
      name: 'githubUrl',
      type: 'text',
      admin: {
        description: 'Optional link to GitHub repository',
      },
    },
  ],
  timestamps: true,
}
