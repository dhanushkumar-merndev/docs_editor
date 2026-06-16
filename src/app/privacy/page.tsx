import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Privacy Policy</h1>
      <p className="mt-4 text-sm text-zinc-500">Last updated: June 2026</p>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        <p>Your privacy is important to us. This policy explains how Ajaia Docs handles your data.</p>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">1. Data We Collect</h2>
        <p>We collect your name, email address, and profile picture from Google OAuth when you sign in. We also store documents and images you upload.</p>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">2. How We Use Data</h2>
        <p>Your data is used solely to provide the document editing and sharing service. We do not sell or share your data with third parties.</p>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">3. Data Storage</h2>
        <p>Your documents and images are stored securely in Supabase Postgres and Supabase Storage respectively.</p>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">4. Contact</h2>
        <p>If you have questions about this policy, please contact the Ajaia Docs team.</p>
      </div>
      <div className="mt-8">
        <Link className="text-sm text-zinc-500 underline hover:text-zinc-800 dark:hover:text-zinc-200" href="/login">Back to login</Link>
      </div>
    </main>
  );
}
