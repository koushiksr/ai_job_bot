import React from 'react'
import Link from 'next/link'
import JobFluxLogo from '@/components/JobFluxLogo'
import Footer from '@/components/Footer'
import { Shield, AlertTriangle, FileText, CheckCircle2, Lock, Scale } from 'lucide-react'

export const metadata = {
  title: 'Terms of Service & Legal Disclaimer - JobFlux AI',
  description: 'Terms of Service, User Agency Agreement, and Legal Disclaimers for JobFlux AI.'
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col selection:bg-zinc-800 selection:text-white">
      {/* Header */}
      <header className="w-full border-b border-zinc-900 bg-black/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <JobFluxLogo size="sm" />
          </Link>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/pricing" className="text-zinc-400 hover:text-white transition-colors">Pricing</Link>
            <Link href="/dashboard" className="px-3 py-1.5 rounded-lg bg-white text-black font-semibold hover:bg-zinc-200 transition-colors">
              Open Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 sm:py-16 space-y-12">
        <div className="space-y-4 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
            <Scale className="w-3.5 h-3.5 text-zinc-400" />
            <span>Legal Framework & Terms</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Terms of Service & User Agency Agreement
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Last Updated: September 16, 2026. Please read these terms carefully before utilizing the JobFlux AI platform.
          </p>
        </div>

        {/* Important Notice Box */}
        <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
          <div className="flex items-center gap-2.5 text-amber-400">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h2 className="text-sm font-semibold tracking-wide">Independent Platform Disclaimer</h2>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            JobFlux AI is an independent software productivity suite designed to assist job candidates in formatting, tracking, and automating repetitive application submissions. JobFlux AI is <strong className="text-white">NOT</strong> affiliated with, associated with, authorized by, endorsed by, or in any way officially connected with <strong className="text-white">Info Edge (India) Ltd.</strong>, <strong className="text-white">Naukri.com</strong>, or any of their subsidiaries or affiliates. All official product and company names are registered trademarks of their respective owners.
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-3 border-t border-zinc-900 pt-8">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-zinc-400" />
            1. Appointment of Authorized Digital Agent
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            By creating an account and providing credentials, you explicitly authorize JobFlux AI to act as your authorized digital assistant. The software executes browser actions (including searching job postings, filling application forms, answering pre-screening questions, and submitting resumes) solely at your direction and using data extracted from your uploaded resume and profile configuration.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3 border-t border-zinc-900 pt-8">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-zinc-400" />
            2. Account Security & Credential Handling
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Candidate credentials (such as login emails and passwords) are stored encrypted in dedicated, private database clusters. Credentials are used strictly for executing authorized candidate sessions. JobFlux AI never sells, shares, or transfers your credentials or candidate data to any third-party advertisers or recruitment agencies. You maintain the right to modify or revoke your credentials at any time.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3 border-t border-zinc-900 pt-8">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-zinc-400" />
            3. Third-Party Platform Policies & Limitation of Liability
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Job boards and recruitment portals (including Naukri.com, LinkedIn, and others) maintain their own independent terms of service, which may restrict or prohibit automated tools. While JobFlux AI employs human-like pacing, randomized delays, and daily application limits (typically 15 to 25 applications per day) to simulate authentic candidate behavior, third-party platforms may update their anti-automation mechanisms, present CAPTCHA challenges, require two-factor verification, or temporarily restrict account access.
          </p>
          <p className="text-xs text-zinc-400 leading-relaxed">
            JobFlux AI provides its software on an &quot;AS-IS&quot; and &quot;AS-AVAILABLE&quot; basis. JobFlux AI, its developers, and operators shall not be liable for any third-party account restrictions, temporary logouts, shadowbans, application rejections, or hiring decisions made by employers.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3 border-t border-zinc-900 pt-8">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-zinc-400" />
            4. Employer Blacklisting & Privacy Protection
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            JobFlux AI includes automated employer blacklisting features designed to prevent applications to your current or past employers. While this system uses normalized matching and keyword exclusion filters, you remain responsible for reviewing and confirming that all companies you wish to exclude are present in your blacklist before enabling automated runs.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3 border-t border-zinc-900 pt-8">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Scale className="w-4 h-4 text-zinc-400" />
            5. Subscriptions, Fees & Refund Policy
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Access to daily autonomous sweeps and extended application queues requires an active subscription or promotional pass. All fees are processed through secure payment gateways (such as Razorpay). Subscriptions provide computational access and automation capacity; JobFlux AI does not guarantee interviews, offers, or specific compensation levels. Refunds may be requested within 48 hours of initial purchase if technical defects prevent the software from executing.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3 border-t border-zinc-900 pt-8">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Scale className="w-4 h-4 text-zinc-400" />
            6. Governing Law & Jurisdiction
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            These terms shall be governed by and construed in accordance with the laws of India. Any disputes arising in connection with these terms shall be subject to the exclusive jurisdiction of the courts located in Bengaluru, Karnataka, India.
          </p>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
