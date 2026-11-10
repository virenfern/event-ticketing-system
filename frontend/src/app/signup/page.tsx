
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"attendee" | "organizer">("attendee");
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (role === "organizer" && !orgName.trim()) {
      setError("Please enter your organization name.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          ...(role === "organizer" && { orgName: orgName.trim() }),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Registration failed. Please try again.");
      }

      router.push("/login?registered=1");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#09090f] px-5 py-12 text-white">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-10 block text-center text-4xl font-black">
          VYBE<span className="text-violet-500">.</span>
        </Link>

        <div className="rounded-3xl border border-white/10 bg-[#12121b] p-8 shadow-2xl shadow-violet-950/20 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-400">
            Join the community
          </p>

          <h1 className="mt-3 text-3xl font-bold">Create your account</h1>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Discover events, meet people and experience more with VYBE.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm text-zinc-300">
                Full name
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                autoComplete="name"
                required
                className="w-full rounded-xl border border-white/10 bg-[#09090f] px-4 py-3.5 text-sm outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm text-zinc-300">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-white/10 bg-[#09090f] px-4 py-3.5 text-sm outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label htmlFor="role" className="mb-2 block text-sm text-zinc-300">
                Register as
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as "attendee" | "organizer")
                }
                className="w-full rounded-xl border border-white/10 bg-[#09090f] px-4 py-3.5 text-sm text-white outline-none focus:border-violet-500"
              >
                <option value="attendee">Attendee</option>
                <option value="organizer">Organizer</option>
              </select>
            </div>

            {role === "organizer" && (
              <div>
                <label
                  htmlFor="orgName"
                  className="mb-2 block text-sm text-zinc-300"
                >
                  Organization name
                </label>
                <input
                  id="orgName"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Your organization"
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#09090f] px-4 py-3.5 text-sm outline-none focus:border-violet-500"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm text-zinc-300"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                required
                className="w-full rounded-xl border border-white/10 bg-[#09090f] px-4 py-3.5 text-sm outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm text-zinc-300"
              >
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                required
                className="w-full rounded-xl border border-white/10 bg-[#09090f] px-4 py-3.5 text-sm outline-none focus:border-violet-500"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-violet-600 py-3.5 text-sm font-semibold transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-zinc-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-violet-400 hover:text-violet-300"
            >
              Sign in
            </Link>
          </p>
        </div>

        <Link
          href="/"
          className="mt-8 block text-center text-sm text-zinc-500 hover:text-violet-400"
        >
          ← Back to home
        </Link>
      </div>
    </main>
  );
}
