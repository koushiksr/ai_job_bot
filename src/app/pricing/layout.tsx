import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing & Plans | JobFlux AI Autonomous Job Apply Bot',
  description:
    'Start free with 1-Day Trial (₹0). Upgrade to 1-Month Essentials (₹499) or 3-Month Professional (₹1,199 / 1,800+ applications) for dual daily 6 AM & 8 AM automated recruiter applications.',
  keywords: [
    'naukri bot pricing',
    'naukri auto apply cost',
    'ai job apply bot price',
    'automated job application plans india',
    'jobflux ai subscription',
    'naukri profile booster price'
  ],
  alternates: {
    canonical: '/pricing'
  },
  openGraph: {
    title: 'Pricing & Plans | JobFlux AI Autonomous Job Apply Bot',
    description:
      'Start free with 1-Day Trial (₹0). Upgrade to Essentials or Professional for automated daily 6 AM & 8 AM recruiter applications.',
    url: '/pricing',
    siteName: 'JobFlux AI',
    type: 'website',
    images: [
      {
        url: '/logo.jpg',
        width: 1200,
        height: 630,
        alt: 'JobFlux AI Pricing & Plans'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing & Plans | JobFlux AI Autonomous Job Apply Bot',
    description:
      'Start free with 1-Day Trial (₹0). Upgrade to Essentials or Professional for automated daily 6 AM & 8 AM recruiter applications.',
    images: ['/logo.jpg']
  }
}

export default function PricingLayout({
  children
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

