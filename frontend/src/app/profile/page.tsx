
"use client";

import { useState } from "react";
import Link from "next/link";

export default function ProfilePage() {
  const [name, setName] = useState("Alex Morgan");
  const [email, setEmail] = useState("alex@example.com");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("Profile changes will be saved once backend integration is complete.");
  }

  return (
    <main className="min-h-screen bg-[#09090f] px-5 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <nav className="mb-12 flex items-center justify-between">
          <Link href="/" className="text-3xl font-black">
            VYBE<span className="text-violet-500">.</span>
          </Link>
          <Link href="/" className="text-sm text-zinc-400 transition hover:text-white">
            Back to home
          </Link>
        </nav>

        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-400">
            Your account
          </p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Profile settings</h1>
          <p className="mt-3 text-zinc-400">
            Manage your personal information and account details.
          </p>
        </div>

        <section className="rounded-3xl border border-white/10 bg-[#12121b] p-6 sm:p-9">
          <div className="mb-8 flex items-center gap-5 border-b border-white/10 pb-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-600 text-2xl font-bold">
              {name.trim().charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <h2 className="text-lg font-semibold">{name || "Your name"}</h2>
              <p className="mt-1 text-sm text-zinc-400">{email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-zinc-300">
                Full name
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setMessage("");
                }}
                required
                className="w-full rounded-xl border border-white/10 bg-[#09090f] px-4 py-3.5 text-sm outline-none focus:border-violet-500"
              />
            </div>

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
                required
                className="w-full rounded-xl border border-white/10 bg-[#09090f] px-4 py-3.5 text-sm outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label htmlFor="phone" className="mb-2 block text-sm font-medium text-zinc-300">
                Phone number
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setMessage("");
                }}
                placeholder="Enter your phone number"
                className="w-full rounded-xl border border-white/10 bg-[#09090f] px-4 py-3.5 text-sm outline-none focus:border-violet-500"
              />
            </div>

            {message && (
              <p role="status" className="rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-sm leading-6 text-violet-300">
                {message}
              </p>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                className="rounded-xl bg-violet-600 px-6 py-3.5 text-sm font-semibold transition hover:bg-violet-500"
              >
                Save changes
              </button>
              <Link
                href="/"
                className="rounded-xl border border-white/10 px-6 py-3.5 text-center text-sm font-semibold text-zinc-300 transition hover:border-white/30 hover:text-white"
              >
                Cancel
              </Link>
            </div>
          </form>
        </section>

        <p className="mt-6 text-xs leading-5 text-zinc-600">
          This is a frontend demonstration. Profile information is not yet
          connected to a database.
        </p>
      </div>
    </main>
  );
}
