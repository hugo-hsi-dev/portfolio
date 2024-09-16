import { GlobalConfig } from 'payload'

export const AboutMe: GlobalConfig = {
  slug: 'aboutMe',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'content',
      type: 'textarea',
      required: true,
    },
  ],
}
