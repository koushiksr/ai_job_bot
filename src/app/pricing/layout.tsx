import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing & Plans | JobFlux AI Autonomous Job Apply Bot',
  description:
    'Start for free (₹0, no credit card required). Upgrade to 1-Month Pro (₹499) or 3-Month Pro (₹1,299) for continuous daily automated recruiter applications.',
  keywords: [
    'job apply bot pricing',
    'auto apply bot cost',
    'ai job apply bot price',
    'automated job application plans india',
    'jobflux ai subscription',
    'profile booster price'
  ],
  alternates: {
    canonical: '/pricing'
  },
  openGraph: {
    title: 'Pricing & Plans | JobFlux AI Autonomous Job Apply Bot',
    description:
      'Start for free (₹0, no credit card required). Upgrade to Essentials or Professional for daily 6 AM recruiter applications.',
    url: '/pricing',
    siteName: 'JobFlux AI',
    type: 'website',
    images: [
      {
        url: '/icon.svg',
        width: 512,
        height: 512,
        alt: 'JobFlux AI Pricing & Plans'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing & Plans | JobFlux AI Autonomous Job Apply Bot',
    description:
      'Start for free (₹0, no credit card required). Upgrade to Essentials or Professional for daily 6 AM recruiter applications.',
    images: ['/icon.svg']
  }
}

export default function PricingLayout({
  children
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

