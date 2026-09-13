import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://jobfluxai.vercel.app";

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "JobFlux AI | Autonomous Naukri Job Apply Bot & Harvard ATS Resume Studio",
    template: "%s | JobFlux AI"
  },
  description:
    "Autonomous AI agent that applies to 1,800+ verified high-paying tech jobs on Naukri with custom screening Q&As and single-column Harvard ATS resumes. Safe, automated, dual morning runs at 6 AM & 8 AM IST.",
  applicationName: "JobFlux AI",
  keywords: [
    "naukri auto apply bot",
    "naukri automatic job application",
    "ai job apply bot",
    "automated job application bot india",
    "naukri bot python",
    "harvard ats resume builder",
    "faang ats resume template",
    "single column ats resume",
    "workday ats parser compliant",
    "greenhouse lever ats bypass",
    "ai job search bot",
    "naukri profile booster",
    "autonomous recruiter dispatch",
    "tech jobs auto apply bengaluru hyderabad"
  ],
  authors: [{ name: "JobFlux AI Engineering Team", url: siteUrl }],
  creator: "JobFlux AI",
  publisher: "JobFlux AI",
  category: "Careers & Recruitment Automation",
  alternates: {
    canonical: "/"
  },
  icons: {
    icon: [
      { url: "/icon.svg?v=4", type: "image/svg+xml" },
      { url: "/jobflux-logo.svg?v=4", type: "image/svg+xml" },
      { url: "/favicon.svg?v=4", type: "image/svg+xml" }
    ],
    shortcut: "/icon.svg?v=4",
    apple: "/icon.svg?v=4"
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "JobFlux AI",
    title: "JobFlux AI | Autonomous Naukri Job Apply Bot & Harvard ATS Resume Studio",
    description:
      "Autonomous AI agent that applies to 1,800+ verified high-paying tech jobs on Naukri with custom screening Q&As and single-column Harvard ATS resumes. Dual runs at 6 AM & 8 AM IST.",
    images: [
      {
        url: "/logo.jpg",
        width: 1200,
        height: 630,
        alt: "JobFlux AI Autonomous Job Application Engine"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "JobFlux AI | Autonomous Naukri Job Apply Bot & Harvard ATS Resume Studio",
    description:
      "Autonomous AI agent that applies to 1,800+ verified high-paying tech jobs on Naukri with custom screening Q&As and single-column Harvard ATS resumes.",
    images: ["/logo.jpg"],
    creator: "@jobfluxai"
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  }
};

const jsonLdData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "name": "JobFlux AI",
      "operatingSystem": "Web, Cloud",
      "applicationCategory": "BusinessApplication",
      "url": siteUrl,
      "description":
        "Autonomous AI agent that applies to 1,800+ verified high-paying tech jobs on Naukri with custom screening Q&As and single-column Harvard ATS resumes.",
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "INR",
        "lowPrice": "0",
        "highPrice": "1199",
        "offerCount": "3"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "ratingCount": "1280",
        "reviewCount": "840",
        "bestRating": "5",
        "worstRating": "1"
      }
    },
    {
      "@type": "WebSite",
      "name": "JobFlux AI",
      "url": siteUrl,
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${siteUrl}/?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "Organization",
      "name": "JobFlux AI",
      "url": siteUrl,
      "logo": `${siteUrl}/jobflux-logo.svg`,
      "contactPoint": {
        "@type": "ContactPoint",
        "email": "technohmsit@gmail.com",
        "contactType": "Customer Support",
        "availableLanguage": ["English", "Hindi"]
      }
    }
  ]
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
