import { MetadataRoute } from 'next'

const baseUrl = 'https://www.hugohsi.dev'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/media/file/'],
        disallow: ['/admin', '/api/', '/graphql', '/graphql-playground'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
