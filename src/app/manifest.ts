import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'JobFlux AI — Autonomous Job Application Engine',
    short_name: 'JobFlux AI',
    description: 'Autonomous AI agent that applies to 1,800+ verified high-paying tech jobs on Naukri with custom screening Q&As and single-column Harvard ATS resumes.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml'
      },
      {
        src: '/images/icon.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/images/icon.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  }
}

