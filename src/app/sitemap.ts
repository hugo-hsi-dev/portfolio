import { MetadataRoute } from 'next'

const baseUrl = 'https://www.hugohsi.dev'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]
}
