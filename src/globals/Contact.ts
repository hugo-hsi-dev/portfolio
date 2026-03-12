import type { GlobalConfig } from 'payload'

export const Contact: GlobalConfig = {
  slug: 'contact',
  fields: [
    {
      name: 'email',
      type: 'text',
      required: true,
    },
    {
      name: 'linkedin',
      type: 'text',
    },
    {
      name: 'github',
      type: 'text',
    },
    {
      name: 'twitter',
      type: 'text',
    },
    {
      name: 'location',
      type: 'text',
    },
    {
      name: 'availability',
      type: 'select',
      options: [
        { label: 'Available for hire', value: 'available' },
        { label: 'Open to opportunities', value: 'open' },
        { label: 'Not available', value: 'unavailable' },
      ],
    },
  ],
}
