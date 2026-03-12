import type { GlobalConfig } from 'payload'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  admin: {
    group: 'Settings',
  },
  fields: [
    {
      name: 'siteName',
      type: 'text',
      required: true,
      defaultValue: 'Portfolio',
      admin: {
        description: 'Site name (appears in browser tab, page titles)',
      },
    },
    {
      name: 'tagline',
      type: 'text',
      admin: {
        description: 'Short tagline (optional, used in page titles and meta)',
      },
    },
    {
      name: 'defaultMetaDescription',
      type: 'text',
      admin: {
        description:
          'Default meta description for SEO (used when no page-specific description exists)',
      },
    },
  ],
}
