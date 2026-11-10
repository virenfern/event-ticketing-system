
"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(
      "If an account exists with this email, password reset instructions will be sent."
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#09090f] px-5 py-12 text-white">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-10 block text-center text-4xl font-black">
          VYBE<span className="text-violet-500">.</span>
        </Link>

        <div className="rounded-3xl border border-white/10 bg-[#12121b] p-8 shadow-2xl shadow-violet-950/20 sm:p-10">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-violet-400">
              Account recovery
            </p>
            <h1 className="mt-3 text-3xl font-bold">Forgot password?</h1>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Don't worry. Enter your registered email address and we'll help
              you reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-zinc-300">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setMessage("");
                }}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-white/10 bg-[#09090f] px-4 py-3.5 text-sm outline-none transition placeholder:text-zinc-600 focus:border-violet-500"
              />
            </div>

            {message && (
              <p role="status" className="rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-sm leading-6 text-violet-300">
                {message}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-violet-600 py-3.5 text-sm font-semibold transition hover:bg-violet-500"
            >
              Send reset instructions
            </button>
          </form>

          <Link
            href="/login"
            className="mt-7 block text-center text-sm font-medium text-violet-400 transition hover:text-violet-300"
          >
            ← Back to sign in
          </Link>
        </div>

        <p className="mt-8 text-center text-xs text-zinc-600">
          © 2026 VYBE. Find your people. Feel the moment.
        </p>
      </div>
    </main>
  );
}
