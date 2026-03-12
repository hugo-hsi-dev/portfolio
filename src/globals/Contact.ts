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
      name: 'socialLinks',
      type: 'array',
      fields: [
        {
          name: 'platform',
          type: 'select',
          options: [
            { label: 'GitHub', value: 'github' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'Twitter/X', value: 'twitter' },
            { label: 'Mastodon', value: 'mastodon' },
            { label: 'Website', value: 'website' },
            { label: 'Other', value: 'other' },
          ],
          required: true,
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
      ],
      admin: {
        description: 'Social/professional links (GitHub, LinkedIn, etc.)',
      },
    },
  ],
}
