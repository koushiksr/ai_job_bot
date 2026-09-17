'use client'

import Script from 'next/script'

/**
 * Universal Tracking Scripts Component
 * 
 * Conditionally loads:
 * 1. Meta (Facebook / Instagram) Pixel for conversion tracking & retargeting
 * 2. Google Analytics 4 (GA4) / Google Ads Tag for conversion tracking & ROAS measurement
 * 
 * Activated automatically when NEXT_PUBLIC_FACEBOOK_PIXEL_ID or NEXT_PUBLIC_GA_MEASUREMENT_ID are set.
 * If unset, renders null safely with zero performance overhead.
 */
export default function TrackingScripts() {
  const fbPixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID?.trim()
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim()

  return (
    <>
      {/* Meta (Facebook / Instagram) Pixel */}
      {fbPixelId && (
        <>
          <Script
            id="meta-pixel-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${fbPixelId}');
                fbq('track', 'PageView');
              `
            }}
          />
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              src={`https://www.facebook.com/tr?id=${fbPixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}

      {/* Google Analytics 4 (GA4) / Google Ads Tag */}
      {gaMeasurementId && (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
          />
          <Script
            id="google-analytics-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaMeasurementId}', {
                  page_path: window.location.pathname,
                });
              `
            }}
          />
        </>
      )}
    </>
  )
}
