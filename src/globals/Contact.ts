import { GlobalConfig } from 'payload'

export const Contact: GlobalConfig = {
  slug: 'contacts',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'email',
      type: 'text',
      required: true,
    },
    {
      name: 'githubUrl',
      type: 'text',
      required: true,
    },
    {
      name: 'linkedinUrl',
      type: 'text',
      required: true,
    },
  ],
}
