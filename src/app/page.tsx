
"use client";

import { useState } from "react";

const events = [
  {
    id: 1,
    title: "Echoes of Tomorrow",
    category: "Music",
    date: "OCT 24, 2026",
    location: "Bengaluru, Karnataka",
    price: 799,
    symbol: "♫",
    gradient: "from-violet-600 to-indigo-950",
    description: "An unforgettable night of live music and energy.",
  },
  {
    id: 2,
    title: "TechConnect Summit",
    category: "Technology",
    date: "OCT 28, 2026",
    location: "Bengaluru, Karnataka",
    price: 499,
    symbol: "</>",
    gradient: "from-cyan-500 to-blue-950",
    description: "Discover ideas shaping the future of technology.",
  },
  {
    id: 3,
    title: "Canvas & Coffee",
    category: "Art & Culture",
    date: "NOV 02, 2026",
    location: "Bengaluru, Karnataka",
    price: 349,
    symbol: "✳",
    gradient: "from-orange-400 to-purple-900",
    description: "A creative afternoon of art, coffee, and community.",
  },
];

export default function Home() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const categories = ["All", "Music", "Technology", "Art & Culture"];

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(search.toLowerCase()) ||
      event.location.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      category === "All" || event.category === category;

    return matchesSearch && matchesCategory;
  });

  return (
    <main className="min-h-screen bg-[#080b14] text-white">
      <nav className="sticky top-0 z-20 border-b border-white/10 bg-[#080b14]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <a href="/" className="text-2xl font-black">
            tix<span className="text-violet-400">ly.</span>
          </a>

          <div className="hidden gap-8 text-sm text-gray-300 sm:flex">
            <a href="#events" className="hover:text-violet-300">
              Explore events
            </a>
            <a href="#about" className="hover:text-violet-300">
              About
            </a>
          </div>

          <div className="flex items-center gap-3">
            <a href="/login" className="rounded-xl px-3 py-2 hover:bg-white/10">
              Log in
            </a>
            <a
              href="/signup"
              className="rounded-xl bg-violet-500 px-4 py-2 font-semibold hover:bg-violet-400"
            >
              Sign up
            </a>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-20 left-1/4 h-80 w-80 rounded-full bg-violet-600/20 blur-[120px]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
          <div>
            <p className="mb-6 inline-block rounded-full border border-violet-400/30 bg-violet-400/10 px-4 py-2 text-sm text-violet-200">
              YOUR NEXT EXPERIENCE STARTS HERE
            </p>

            <h1 className="text-5xl font-black leading-tight sm:text-6xl lg:text-7xl">
              Find your
              <br />
              people. Feel the
              <br />
              <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                moment.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-8 text-gray-400">
              From live music and tech conferences to creative experiences,
              discover events worth stepping out for.
            </p>

            <a
              href="#events"
              className="mt-8 inline-block rounded-xl bg-violet-500 px-6 py-4 font-semibold hover:bg-violet-400"
            >
              Explore events →
            </a>

            <div className="mt-10 flex gap-8 border-t border-white/10 pt-6">
              <div>
                <p className="text-xl font-bold">Discover</p>
                <p className="text-sm text-gray-500">Events you love</p>
              </div>
              <div>
                <p className="text-xl font-bold">Book</p>
                <p className="text-sm text-gray-500">Your next experience</p>
              </div>
              <div>
                <p className="text-xl font-bold">Connect</p>
                <p className="text-sm text-gray-500">With your community</p>
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-lg">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-600 via-purple-800 to-slate-950 p-8 sm:p-12">
              <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full border-[30px] border-white/10" />
              <div className="absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-pink-500/20 blur-2xl" />

              <div className="relative">
                <span className="rounded-full bg-white/15 px-3 py-2 text-xs font-bold tracking-widest">
                  FEATURED EXPERIENCE
                </span>
                <p className="mb-5 mt-16 text-7xl">♫</p>
                <p className="text-sm font-semibold tracking-widest text-violet-200">
                  LIVE MUSIC · BENGALURU
                </p>
                <h2 className="mt-3 text-4xl font-black">
                  Echoes of Tomorrow
                </h2>
                <p className="mt-3 text-gray-300">
                  One stage. Incredible music. Unforgettable memories.
                </p>
                <div className="mt-8 flex items-center justify-between border-t border-white/20 pt-5">
                  <div>
                    <p className="text-sm text-gray-300">Tickets from</p>
                    <p className="text-2xl font-bold">₹799</p>
                  </div>
                  <a
                    href="#events"
                    className="rounded-xl bg-white px-5 py-3 font-bold text-violet-950 hover:bg-violet-100"
                  >
                    Find tickets
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="events" className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold tracking-widest text-violet-400">
              HANDPICKED FOR YOU
            </p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              Explore events
            </h2>
            <p className="mt-2 text-gray-400">
              Find something worth looking forward to.
            </p>
          </div>

          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events..."
            aria-label="Search events"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-gray-500 focus:border-violet-400 sm:max-w-xs"
          />
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {categories.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                category === item
                  ? "bg-violet-500 text-white"
                  : "border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
            <article
              key={event.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:-translate-y-1 hover:border-violet-400/50"
            >
              <div
                className={`flex h-48 items-center justify-center bg-gradient-to-br ${event.gradient}`}
              >
                <span className="text-7xl font-black text-white/90">
                  {event.symbol}
                </span>
              </div>

              <div className="p-6">
                <span className="text-xs font-bold tracking-widest text-violet-400">
                  {event.category.toUpperCase()}
                </span>
                <h3 className="mt-3 text-xl font-bold">{event.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-400">
                  {event.description}
                </p>

                <div className="mt-5 space-y-2 text-sm text-gray-400">
                  <p>📅 {event.date}</p>
                  <p>📍 {event.location}</p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
                  <div>
                    <p className="text-xs text-gray-500">Starting from</p>
                    <p className="mt-1 text-xl font-bold">₹{event.price}</p>
                  </div>
                  <a
                    href="/login"
                    className="rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold hover:bg-violet-400"
                  >
                    Book tickets →
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <p className="py-16 text-center text-gray-400">
            No events found. Try another search or category.
          </p>
        )}
      </section>

      <section id="about" className="border-t border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-6 py-16 text-center">
          <h2 className="text-3xl font-black">Your next story starts here.</h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-400">
            Discover experiences, reserve your seats, and make memories with
            tixly.
          </p>
          <a
            href="/signup"
            className="mt-7 inline-block rounded-xl bg-violet-500 px-6 py-3 font-semibold hover:bg-violet-400"
          >
            Get started
          </a>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-6 text-center text-sm text-gray-500">
        © 2026 tixly. Event Ticketing System · Built with Next.js
      </footer>
    </main>
  );
}
