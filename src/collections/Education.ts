import type { CollectionConfig } from 'payload'

export const Education: CollectionConfig = {
  slug: 'education',
  admin: {
    useAsTitle: 'institution',
    defaultColumns: ['institution', 'degree', 'startDate'],
  },
  fields: [
    {
      name: 'institution',
      type: 'text',
      required: true,
    },
    {
      name: 'degree',
      type: 'text',
      required: true,
      admin: {
        description: 'e.g., "Bachelor of Science", "Master of Arts"',
      },
    },
    {
      name: 'startDate',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'monthOnly',
        },
      },
    },
    {
      name: 'endDate',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'monthOnly',
        },
      },
    },
  ],
}
