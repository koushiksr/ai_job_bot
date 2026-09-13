import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Harvard & FAANG ATS Resume Builder | 100% Workday & Greenhouse Compliant',
  description:
    'Free single-column Harvard ATS resume builder formatted specifically for Workday, Greenhouse & Lever parsers. Google XYZ formula metrics with 1-click Naukri Auto-Apply Bot cloud sync.',
  keywords: [
    'harvard resume format',
    'ats resume builder free',
    'faang resume template',
    'single column ats resume',
    'workday ats parser compliant',
    'greenhouse resume template',
    'lever ats format',
    'ai resume builder india',
    'tech resume generator'
  ],
  alternates: {
    canonical: '/resume-builder'
  },
  openGraph: {
    title: 'Harvard & FAANG ATS Resume Builder | JobFlux AI',
    description:
      'Build an authentic single-column Harvard ATS resume that passes Workday, Greenhouse & Lever parsers. 1-click sync with your Naukri Auto-Apply Bot.',
    url: '/resume-builder',
    siteName: 'JobFlux AI',
    type: 'website',
    images: [
      {
        url: '/logo.jpg',
        width: 1200,
        height: 630,
        alt: 'Harvard ATS Resume Studio'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Harvard & FAANG ATS Resume Builder | JobFlux AI',
    description:
      'Build an authentic single-column Harvard ATS resume that passes Workday, Greenhouse & Lever parsers. 1-click sync with your Naukri Auto-Apply Bot.',
    images: ['/logo.jpg']
  }
}

export default function ResumeBuilderLayout({
  children
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

