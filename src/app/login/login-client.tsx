"use client";

import { KeyRound } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function LoginClient() {
  async function signInWithGoogle() {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-zinc-200 p-4 dark:bg-zinc-900">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <section className="w-full max-w-5xl overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 md:grid md:grid-cols-[1.1fr_0.9fr]">
        <div className="flex min-h-[540px] flex-col justify-between bg-zinc-950 p-8 text-white">
          <Logo inverted />
          <div>
            <h1 className="max-w-md text-4xl font-semibold tracking-tight">A focused editor for fast document collaboration.</h1>
            <p className="mt-4 max-w-md text-sm text-zinc-300">
              Sign in with Google to create, edit, and share production documents.
            </p>
          </div>
          <p className="text-xs text-zinc-400">Ajaia Docs uses Better Auth, Supabase Postgres, and Drizzle.</p>
        </div>
        <div className="flex flex-col justify-center p-8 text-zinc-950 dark:text-zinc-50">
          <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">Sign in</h2>
          <p className="mt-2 text-sm text-zinc-950 dark:text-zinc-300">Use your Google account to continue.</p>
          <Button className="mt-8" onClick={signInWithGoogle}>
            <KeyRound className="size-4" />
            Continue with Google
          </Button>
        </div>
      </section>
    </main>
  );
}
