import type { GlobalConfig } from 'payload'

export const Contact: GlobalConfig = {
  slug: 'contact',
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      admin: {
        description: 'Primary contact email',
      },
    },
    {
      name: 'linkedin',
      type: 'text',
    },
    {
      name: 'github',
      type: 'text',
    },
  ],
}
