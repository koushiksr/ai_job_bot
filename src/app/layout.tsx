import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import { ThemeProvider } from "@/components/ThemeProvider";
import VisitorTracker from "@/components/VisitorTracker";
import TrackingScripts from "@/components/TrackingScripts";
import { Analytics } from "@vercel/analytics/next";
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
    default: "JobFlux AI | Autonomous Job Apply Bot & Harvard ATS Resume Studio",
    template: "%s | JobFlux AI"
  },
  description:
    "Autonomous AI agent that applies to verified high-paying tech jobs with custom screening Q&As and single-column Harvard ATS resumes. Safe, automated, daily morning run at 6 AM IST.",
  applicationName: "JobFlux AI",
  keywords: [
    "auto apply bot",
    "automatic job application bot",
    "ai job apply bot",
    "automated job application bot india",
    "autonomous job search agent",
    "harvard ats resume builder",
    "faang ats resume template",
    "single column ats resume",
    "workday ats parser compliant",
    "greenhouse lever ats bypass",
    "ai job search bot",
    "career profile booster",
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
      { url: "/icon.svg?v=5", type: "image/svg+xml" }
    ],
    shortcut: "/icon.svg?v=5",
    apple: "/icon.svg?v=5"
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "JobFlux AI"
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "JobFlux AI",
    title: "JobFlux AI | Autonomous Job Apply Bot & Harvard ATS Resume Studio",
    description:
      "Autonomous AI agent that applies to verified high-paying tech jobs with custom screening Q&As and single-column Harvard ATS resumes. Daily run at 6 AM IST.",
    images: [
      {
        url: "/icon.svg",
        width: 512,
        height: 512,
        alt: "JobFlux AI Autonomous Job Application Engine"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "JobFlux AI | Autonomous Job Apply Bot & Harvard ATS Resume Studio",
    description:
      "Autonomous AI agent that applies to verified high-paying tech jobs with custom screening Q&As and single-column Harvard ATS resumes.",
    images: ["/icon.svg"],
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
        "Autonomous AI agent that applies to verified high-paying tech jobs with custom screening Q&As and single-column Harvard ATS resumes.",
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "INR",
        "lowPrice": "0",
        "highPrice": "199",
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
      "logo": `${siteUrl}/icon.svg`,
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
        {/* Apply stored theme before paint (no dark-flash for light users) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('jf-theme')==='light'){document.documentElement.classList.add('light')}}catch(e){}`
          }}
        />
        {/* Google tag (gtag.js) - Google Ads & Google Analytics */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=AW-825590065"
        />
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-DDZJVV80DM"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-825590065');
              gtag('config', 'G-DDZJVV80DM');
            `
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <ServiceWorkerRegistrar />
          <VisitorTracker />
          <TrackingScripts />
          <Analytics />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
