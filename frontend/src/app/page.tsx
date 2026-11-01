
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const events = [
  {
    id: 1,
    title: "Neon Nights Music Festival",
    category: "Music",
    date: "November 21, 2026",
    location: "Bengaluru",
    price: 1499,
    icon: "🎵",
    color: "from-purple-600/50 to-pink-500/20",
    description: "An unforgettable night of music and energy.",
  },
  {
    id: 2,
    title: "FutureTech Summit 2026",
    category: "Technology",
    date: "November 25, 2026",
    location: "Bengaluru",
    price: 999,
    icon: "💻",
    color: "from-blue-600/50 to-cyan-500/20",
    description: "Explore the future of technology and innovation.",
  },
  {
    id: 3,
    title: "The Creative Canvas",
    category: "Art",
    date: "December 5, 2026",
    location: "Mumbai",
    price: 599,
    icon: "🎨",
    color: "from-orange-600/50 to-pink-500/20",
    description: "A creative space for artists and art lovers.",
  },
  {
    id: 4,
    title: "Startup Connect",
    category: "Business",
    date: "December 12, 2026",
    location: "Hyderabad",
    price: 799,
    icon: "🚀",
    color: "from-emerald-600/50 to-teal-500/20",
    description: "Meet founders, builders and future leaders.",
  },
];

const categories = [
  "All",
  "Music",
  "Technology",
  "Art",
  "Business",
];

export default function Home() {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesCategory =
        category === "All" || event.category === category;

      const matchesSearch =
        event.title.toLowerCase().includes(search.toLowerCase()) ||
        event.location.toLowerCase().includes(search.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [category, search]);

  return (
    <main className="min-h-screen bg-[#09090f] text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#09090f]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-3xl font-black tracking-tight">
            VYBE<span className="text-violet-500">.</span>
          </Link>

          <div className="hidden items-center gap-9 text-sm text-zinc-400 md:flex">
            <a href="#discover" className="transition hover:text-white">
              Discover
            </a>
            <a href="#events" className="transition hover:text-white">
              Events
            </a>
            <a href="#about" className="transition hover:text-white">
              About
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden rounded-xl px-4 py-2 text-sm text-zinc-300 transition hover:text-white sm:block"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold transition hover:bg-violet-500"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section
        id="discover"
        className="relative overflow-hidden border-b border-white/5"
      >
        <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-6 py-28 text-center md:py-36">
          <div className="mb-7 inline-flex rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-xs font-semibold tracking-widest text-violet-300">
            DISCOVER · BOOK · EXPERIENCE
          </div>

          <h1 className="mx-auto max-w-4xl text-5xl font-black leading-tight tracking-tight md:text-7xl">
            Find your next
            <span className="block bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              unforgettable moment.
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-zinc-400 md:text-lg">
            From live concerts to inspiring conferences, discover
            experiences worth stepping out for.
          </p>

          <div className="mx-auto mt-10 flex max-w-2xl flex-col gap-3 rounded-2xl border border-white/10 bg-[#171720] p-3 shadow-2xl shadow-violet-950/20 sm:flex-row">
            <div className="flex flex-1 items-center gap-3 px-3">
              <span className="text-xl">⌕</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events or locations..."
                className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-zinc-500"
              />
            </div>

            <a
              href="#events"
              className="rounded-xl bg-violet-600 px-8 py-3 text-sm font-semibold transition hover:bg-violet-500"
            >
              Explore events
            </a>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-3 text-xs text-zinc-500">
            <span>Popular:</span>
            <span>Music festivals</span>
            <span>·</span>
            <span>Tech conferences</span>
            <span>·</span>
            <span>Workshops</span>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-400">
            Browse by interest
          </p>
          <h2 className="mt-2 text-3xl font-bold">Explore categories</h2>
        </div>

        <div className="flex flex-wrap gap-3">
          {categories.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`rounded-full border px-6 py-3 text-sm transition ${
                category === item
                  ? "border-violet-500 bg-violet-600 text-white"
                  : "border-white/10 bg-[#171720] text-zinc-400 hover:border-violet-500/50 hover:text-white"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {/* Events */}
      <section id="events" className="mx-auto max-w-7xl px-6 pb-24">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-violet-400">
              Find your next experience
            </p>
            <h2 className="mt-2 text-3xl font-bold">Upcoming events</h2>
          </div>
          <span className="text-sm text-zinc-500">
            {filteredEvents.length} events found
          </span>
        </div>

        {filteredEvents.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filteredEvents.map((event) => (
              <article
                key={event.id}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-[#12121b] transition duration-300 hover:-translate-y-1 hover:border-violet-500/50"
              >
                <div
                  className={`relative flex h-48 items-center justify-center bg-gradient-to-br ${event.color}`}
                >
                  <span className="text-7xl transition duration-300 group-hover:scale-110">
                    {event.icon}
                  </span>
                  <span className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs backdrop-blur">
                    {event.category}
                  </span>
                </div>

                <div className="p-5">
                  <p className="text-xs text-violet-400">{event.date}</p>
                  <h3 className="mt-2 text-lg font-bold transition group-hover:text-violet-300">
                    {event.title}
                  </h3>
                  <p className="mt-2 text-sm text-zinc-500">
                    {event.description}
                  </p>
                  <p className="mt-4 text-xs text-zinc-400">
                    📍 {event.location}
                  </p>

                  <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                    <div>
                      <p className="text-xs text-zinc-500">Starting from</p>
                      <p className="text-lg font-bold">
                        ₹{event.price.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <Link
                      href={`/events/${event.id}`}
                      className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-violet-600"
                    >
                      View event
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-[#12121b] py-20 text-center">
            <p className="text-4xl">🔎</p>
            <h3 className="mt-4 text-xl font-bold">No events found</h3>
            <p className="mt-2 text-sm text-zinc-500">
              Try another search or category.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setCategory("All");
              }}
              className="mt-5 rounded-xl bg-violet-600 px-5 py-2 text-sm font-semibold"
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      {/* About */}
      <section id="about" className="border-t border-white/10 bg-[#11111a]">
        <div className="mx-auto max-w-7xl px-6 py-20 text-center">
          <h2 className="text-3xl font-bold">
            More than tickets. <span className="text-violet-400">Experiences.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl leading-7 text-zinc-400">
            VYBE brings people and experiences together. Discover events,
            find your community and make every moment count.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#09090f]">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 px-6 py-9 sm:flex-row sm:items-center">
          <div>
            <p className="text-2xl font-black">
              VYBE<span className="text-violet-500">.</span>
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Find your people. Feel the moment.
            </p>
          </div>
          <p className="text-xs text-zinc-600">
            © 2026 VYBE. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
