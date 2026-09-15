import React from 'react'
import Link from 'next/link'
import JobFluxLogo from '@/components/JobFluxLogo'
import Footer from '@/components/Footer'
import { ShieldCheck, Lock, EyeOff, Trash2, Database, FileCheck } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy & Data Protection - JobFlux AI',
  description: 'Privacy Policy and Data Protection practices for JobFlux AI, compliant with India DPDP Act.'
}

export default function PrivacyPage() {
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
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
            <span>DPDP Act Compliance & Security</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Privacy Policy & Data Protection
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Effective Date: September 16, 2026. Your privacy and candidate data security are foundational to JobFlux AI.
          </p>
        </div>

        {/* Zero Data Selling Guarantee */}
        <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
          <div className="flex items-center gap-2.5 text-emerald-400">
            <EyeOff className="w-5 h-5 shrink-0" />
            <h2 className="text-sm font-semibold tracking-wide">Our Zero-Data-Monetization Guarantee</h2>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            We do <strong className="text-white">NOT</strong> sell, rent, license, or monetize candidate contact details, resumes, work history, or compensation figures to third-party headhunters, data brokers, or advertising networks. Your data is used exclusively to power your own automated job applications.
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-3 border-t border-zinc-900 pt-8">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-zinc-400" />
            1. Information We Collect
          </h3>
          <ul className="text-xs text-zinc-400 space-y-2 list-disc list-inside leading-relaxed">
            <li><strong className="text-zinc-300">Account Information:</strong> Name, email address, and profile picture (via Google OAuth or direct sign-in).</li>
            <li><strong className="text-zinc-300">Resume & Professional Profile:</strong> Work experience, education, skills, target job titles, preferred locations, and compensation preferences.</li>
            <li><strong className="text-zinc-300">Portal Credentials:</strong> Encrypted portal passwords provided strictly to execute candidate-authorized browser runs.</li>
            <li><strong className="text-zinc-300">Application Telemetry:</strong> Records of jobs discovered, applied for, timestamps, and screening question responses.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3 border-t border-zinc-900 pt-8">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-zinc-400" />
            2. How We Protect Your Data
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            All data in transit is encrypted using standard Transport Layer Security (TLS 1.3). Sensitive credentials and resume binary buffers are stored encrypted in private MongoDB Atlas database clusters protected by role-based access controls and IP whitelisting. Automated bot sessions run in isolated headless browser environments that terminate immediately after execution.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3 border-t border-zinc-900 pt-8">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-zinc-400" />
            3. Candidate Rights & Data Deletion
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Under India&apos;s Digital Personal Data Protection (DPDP) Act, you maintain complete ownership of your personal information:
          </p>
          <ul className="text-xs text-zinc-400 space-y-2 list-disc list-inside leading-relaxed">
            <li><strong className="text-zinc-300">Right to Update:</strong> You can edit or replace your resume and credentials at any time in the Profile tab.</li>
            <li><strong className="text-zinc-300">Right to Erasure:</strong> You can request full deletion of your profile, stored resumes, and application logs by contacting our support team at <span className="text-zinc-200">technohmsit@gmail.com</span>.</li>
            <li><strong className="text-zinc-300">Right to Revoke:</strong> You can pause or disable daily automated runs with a single toggle in your dashboard.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3 border-t border-zinc-900 pt-8">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-zinc-400" />
            4. Changes to This Privacy Policy
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            We may update our privacy practices from time to time to reflect evolving legal requirements or platform features. Significant updates will be communicated through the candidate dashboard or via email.
          </p>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
