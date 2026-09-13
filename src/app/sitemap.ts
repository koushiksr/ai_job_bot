import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://jobfluxai.vercel.app'
  const currentDate = new Date().toISOString()

  return [
    {
      url: `${baseUrl}`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0
    },
    {
      url: `${baseUrl}/tools`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.95
    },
    {
      url: `${baseUrl}/tools/naukri-headline-generator`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.95
    },
    {
      url: `${baseUrl}/tools/ats-score-checker`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.95
    },
    {
      url: `${baseUrl}/tools/naukri-profile-score`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.95
    },
    {
      url: `${baseUrl}/resume-builder`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.95
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.85
    }
  ]
}
