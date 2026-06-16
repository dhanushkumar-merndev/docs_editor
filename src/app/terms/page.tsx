import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Terms of Service</h1>
      <p className="mt-4 text-sm text-zinc-500">Last updated: June 2026</p>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        <p>These Terms of Service govern your use of Ajaia Docs. By using the service, you agree to these terms.</p>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">1. Use of Service</h2>
        <p>You may use Ajaia Docs for lawful purposes only. You must not misuse or abuse the service.</p>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">2. Accounts</h2>
        <p>You are responsible for maintaining the confidentiality of your account credentials.</p>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">3. Content</h2>
        <p>You retain ownership of your documents. Ajaia Docs does not claim any ownership over your content.</p>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">4. Limitation of Liability</h2>
        <p>Ajaia Docs is provided &quot;as is&quot; without warranties of any kind.</p>
      </div>
      <div className="mt-8">
        <Link className="text-sm text-zinc-500 underline hover:text-zinc-800 dark:hover:text-zinc-200" href="/login">Back to login</Link>
      </div>
    </main>
  );
}
