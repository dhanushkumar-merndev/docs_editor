"use client";

import { BookOpenText, Loader2 } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" {...props}>
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}

export function LoginClient() {
  const [pending, startTransition] = useTransition();

  function signInWithGoogle() {
    startTransition(async () => {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
    });
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-zinc-200 p-4 dark:bg-zinc-900">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <section className="w-full max-w-5xl overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 md:grid md:grid-cols-[1.1fr_0.9fr]">
        <div className="flex min-h-[540px] flex-col justify-between bg-zinc-950 p-8 text-white dark:bg-white dark:text-zinc-950">
          <div className="flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-lg bg-white text-zinc-950 shadow-sm dark:bg-zinc-950 dark:text-white">
              <BookOpenText className="size-5" strokeWidth={2.4} />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-white dark:text-zinc-950">Ajaia Docs</p>
              <p className="text-xs text-zinc-300 dark:text-zinc-500">Collaborative editor</p>
            </div>
          </div>
          <div>
            <h1 className="max-w-md text-4xl font-semibold tracking-tight text-white dark:text-zinc-950">A focused editor for fast document collaboration.</h1>
            <p className="mt-4 max-w-md text-sm text-zinc-300 dark:text-zinc-500">
              Sign in with Google to create, edit, and share production documents.
            </p>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Ajaia Docs uses Better Auth, Supabase Postgres, and Drizzle.</p>
        </div>
        <div className="flex flex-col justify-center p-8 text-zinc-950 dark:text-zinc-50">
          <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">Sign in</h2>
          <p className="mt-2 text-sm text-zinc-950 dark:text-zinc-300">Use your Google account to continue.</p>
          <Button className="mt-8 justify-center px-3 py-5" onClick={signInWithGoogle} disabled={pending}>
            {pending ? <Loader2 className="size-5 animate-spin" /> : <GoogleIcon className="size-5" />}
            Continue with Google
          </Button>
          <p className="mt-6 text-balance text-center text-xs text-muted-foreground">
            By continuing, you agree to our{" "}
            <Link className="underline hover:text-zinc-800 dark:hover:text-zinc-200" href="/terms">Terms of Service</Link>
            {" "}&amp;{" "}
            <Link className="underline hover:text-zinc-800 dark:hover:text-zinc-200" href="/privacy">Privacy Policy</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
