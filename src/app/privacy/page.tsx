import { BookOpenText } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function PrivacyPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-zinc-200 p-4 dark:bg-zinc-900">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <section className="w-full max-w-3xl overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex min-h-[200px] flex-col justify-between bg-zinc-950 p-8 text-white dark:bg-white dark:text-zinc-950">
          <div className="flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-lg bg-white text-zinc-950 shadow-sm dark:bg-zinc-950 dark:text-white">
              <BookOpenText className="size-5" strokeWidth={2.4} />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-white dark:text-zinc-950">Ajaia Docs</p>
              <p className="text-xs text-zinc-300 dark:text-zinc-500">Privacy Policy</p>
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white dark:text-zinc-950">Privacy Policy</h1>
            <p className="mt-2 text-sm text-zinc-300 dark:text-zinc-500">Last updated: June 2026</p>
          </div>
        </div>
        <div className="space-y-6 p-8 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          <p>Your privacy is important to us. This policy explains how Ajaia Docs collects, uses, and protects your personal data when you use our service.</p>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">1. Information We Collect</h2>
            <p>When you sign in using Google OAuth, we collect your name, email address, and profile picture. We also store the documents you create, the images you upload, and metadata such as document titles, page sizes, and timestamps. Anonymous interaction data such as page views and feature usage may be collected to improve the product.</p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">2. How We Use Your Information</h2>
            <p>Your information is used solely to provide and improve the document editing and sharing service. Specifically, your name and email are used to identify you to collaborators, your documents are stored for persistence across sessions, and your preferences (display name, time zone) are saved for a personalized experience. We do not sell, rent, or share your personal data with third parties for marketing purposes.</p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">3. Data Storage and Security</h2>
            <p>Your documents are stored in Supabase Postgres, a fully managed PostgreSQL database hosted on AWS. Images are stored in Supabase Storage, backed by S3-compatible object storage. Data in transit is encrypted using TLS 1.3. Data at rest is encrypted using AES-256. We retain your data for as long as your account is active. Deleted documents are permanently removed within 30 days.</p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">4. Third-Party Services</h2>
            <p>Ajaia Docs uses the following third-party services: Google OAuth (authentication), Supabase (database and storage), Upstash Redis (rate limiting), and Vercel (hosting). Each provider adheres to their own privacy and security policies. We do not transfer your data outside of these providers&apos; infrastructure.</p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">5. Data Sharing and Collaboration</h2>
            <p>When you share a document with another user, that user gains access to the document content and metadata you have shared. You control who can access your documents through the share dialog. You may revoke access at any time. Real-time presence information (such as whether a collaborator is viewing a document) is visible to all document members.</p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">6. Your Rights</h2>
            <p>You may request access to, correction of, or deletion of your personal data at any time by contacting the Ajaia Docs team. You may also delete your documents individually from the dashboard. Account deletion will remove all associated documents and shared access within 30 days.</p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">7. Cookies</h2>
            <p>Ajaia Docs uses essential session cookies for authentication via Better Auth. No tracking or advertising cookies are used. You may disable cookies in your browser settings, but this may prevent the service from functioning correctly.</p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">8. Changes to This Policy</h2>
            <p>We may update this privacy policy from time to time. Changes will be posted on this page with an updated revision date. Continued use of the service after changes constitute acceptance of the updated policy.</p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">9. Contact</h2>
            <p>If you have questions, concerns, or requests regarding this privacy policy, please contact the Ajaia Docs team through the project repository or support channels.</p>
          </div>
        </div>
        <div className="border-t border-zinc-200 px-8 py-4 dark:border-zinc-800">
          <Link className="text-sm text-zinc-500 underline hover:text-zinc-800 dark:hover:text-zinc-200" href="/login">Back to login</Link>
        </div>
      </section>
    </main>
  );
}
