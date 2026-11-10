
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed. Please try again.");
        return;
      }

      // Login successful. The backend has set the authentication cookie.
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Login request failed:", err);
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#09090f] px-5 py-12 text-white">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-10 block text-center text-4xl font-black tracking-tight"
        >
          VYBE<span className="text-violet-500">.</span>
        </Link>

        <div className="rounded-3xl border border-white/10 bg-[#12121b] p-8 shadow-2xl shadow-violet-950/20 sm:p-10">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-violet-400">
              Welcome back
            </p>

            <h1 className="mt-3 text-3xl font-bold">
              Sign in to VYBE
            </h1>

            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Your next unforgettable experience is waiting for you.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 bg-[#09090f] px-4 py-3.5 text-sm outline-none transition placeholder:text-zinc-600 focus:border-violet-500"
                required
                disabled={loading}
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-zinc-300"
                >
                  Password
                </label>

                <Link
                  href="/forgot-password"
                  className="text-xs text-violet-400 transition hover:text-violet-300"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-white/10 bg-[#09090f] px-4 py-3.5 pr-20 text-sm outline-none transition placeholder:text-zinc-600 focus:border-violet-500"
                  required
                  disabled={loading}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-violet-400 hover:text-violet-300"
                  disabled={loading}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-sm text-violet-300"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-violet-600 py-3.5 text-sm font-semibold transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-zinc-600">NEW TO VYBE?</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <Link
            href="/signup"
            className="block w-full rounded-xl border border-white/10 py-3.5 text-center text-sm font-semibold text-zinc-300 transition hover:border-violet-500 hover:text-white"
          >
            Create an account
          </Link>
        </div>

        <p className="mt-8 text-center text-xs text-zinc-600">
          © 2026 VYBE. Find your people. Feel the moment.
        </p>

        <Link
          href="/"
          className="mt-5 block text-center text-sm text-zinc-500 transition hover:text-violet-400"
        >
          ← Back to home
        </Link>
      </div>
    </main>
  );
}
