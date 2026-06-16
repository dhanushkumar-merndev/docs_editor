import { BookOpenText } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function TermsPage() {
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
              <p className="text-xs text-zinc-300 dark:text-zinc-500">Terms of Service</p>
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white dark:text-zinc-950">Terms of Service</h1>
            <p className="mt-2 text-sm text-zinc-300 dark:text-zinc-500">Last updated: June 2026</p>
          </div>
        </div>
        <div className="space-y-6 p-8 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          <p>These Terms of Service govern your use of Ajaia Docs. By accessing or using the service, you agree to be bound by these terms. If you do not agree, do not use the service.</p>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">1. Acceptance of Terms</h2>
            <p>By creating an account or using Ajaia Docs in any way, you accept these Terms of Service and agree to comply with them. These terms apply to all users, including document owners, editors, and viewers.</p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">2. Use of Service</h2>
            <p>You may use Ajaia Docs for lawful purposes only. You agree not to misuse the service, including but not limited to: uploading malicious content, attempting to bypass access controls, exceeding rate limits intentionally, or using the service to distribute harmful material. We reserve the right to suspend access for violations.</p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">3. User Accounts</h2>
            <p>You must sign in using a valid Google account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use. Each user may have only one active account.</p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">4. Content Ownership</h2>
            <p>You retain full ownership of all documents and content you create using Ajaia Docs. Ajaia Docs does not claim any intellectual property rights over your content. By using the service, you grant us a limited license to store, process, and transmit your content solely for the purpose of providing the service to you.</p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">5. Sharing and Permissions</h2>
            <p>Document owners control access to their documents. Owners may invite other users as editors or viewers, and may revoke access at any time. Editors may modify content but cannot share or delete documents. Viewers have read-only access. Each document is limited to a maximum of 10 members, including the owner.</p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">6. Acceptable Use</h2>
            <p>You agree not to: upload illegal, infringing, or harmful content; attempt to access documents you have not been invited to; interfere with other users&apos; editing sessions; reverse-engineer the service; or use automated scripts to interact with the service beyond normal usage patterns.</p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">7. Service Availability</h2>
            <p>Ajaia Docs is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We strive for high availability but do not guarantee uninterrupted service. We may perform maintenance, updates, or suspend the service temporarily at our discretion. We are not liable for any data loss resulting from service interruptions.</p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">8. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Ajaia Docs and its contributors are not liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service. This includes but is not limited to data loss, loss of profits, or interruption of business.</p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">9. Termination</h2>
            <p>We reserve the right to suspend or terminate your access to Ajaia Docs at any time, with or without cause, including for violation of these terms. Upon termination, your documents may be deleted after 30 days. You may stop using the service at any time by deleting your documents and discontinuing use.</p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">10. Changes to Terms</h2>
            <p>We may revise these terms from time to time. Changes will be posted on this page with an updated revision date. Your continued use of the service after changes constitutes acceptance of the new terms. If you do not agree to the changes, you must stop using the service.</p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">11. Governing Law</h2>
            <p>These terms are governed by the laws of India. Any disputes arising from these terms or the use of Ajaia Docs shall be resolved in the courts of Bangalore, Karnataka, India.</p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">12. Contact</h2>
            <p>For questions about these terms, please reach out to the Ajaia Docs team through the project repository.</p>
          </div>
        </div>
        <div className="border-t border-zinc-200 px-8 py-4 dark:border-zinc-800">
          <Link className="text-sm text-zinc-500 underline hover:text-zinc-800 dark:hover:text-zinc-200" href="/login">Back to login</Link>
        </div>
      </section>
    </main>
  );
}
