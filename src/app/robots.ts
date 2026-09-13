import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://jobfluxai.vercel.app'

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/pricing', '/resume-builder'],
        disallow: ['/api/', '/admin/', '/dashboard/']
      },
      {
        userAgent: 'Googlebot',
        allow: ['/', '/pricing', '/resume-builder'],
        disallow: ['/api/', '/admin/']
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl
  }
}

