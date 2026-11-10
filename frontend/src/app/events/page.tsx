
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const events = [
  {
    id: "1",
    title: "Neon Nights Music Festival",
    category: "Music",
    date: "Nov 21, 2026",
    location: "Bengaluru",
    price: 1499,
    description: "An unforgettable night of music, lights and live performances.",
    tag: "POPULAR",
    gradient: "from-purple-600 to-pink-500",
  },
  {
    id: "2",
    title: "FutureTech Summit 2026",
    category: "Technology",
    date: "Nov 25, 2026",
    location: "Bengaluru",
    price: 999,
    description: "Explore the future of AI, technology and innovation.",
    tag: "TRENDING",
    gradient: "from-blue-600 to-cyan-500",
  },
  {
    id: "3",
    title: "The Creative Canvas",
    category: "Art",
    date: "Dec 5, 2026",
    location: "Mumbai",
    price: 599,
    description: "Experience creativity through art, design and imagination.",
    tag: "NEW",
    gradient: "from-orange-500 to-rose-500",
  },
  {
    id: "4",
    title: "Startup Connect",
    category: "Business",
    date: "Dec 12, 2026",
    location: "Hyderabad",
    price: 799,
    description: "Connect with founders, investors and future entrepreneurs.",
    tag: "FEATURED",
    gradient: "from-emerald-600 to-teal-400",
  },
  {
    id: "5",
    title: "Indie Music Evening",
    category: "Music",
    date: "Dec 18, 2026",
    location: "Mumbai",
    price: 499,
    description: "Discover independent artists and emerging musicians.",
    tag: "LIVE",
    gradient: "from-fuchsia-600 to-purple-500",
  },
  {
    id: "6",
    title: "Design & Innovation Expo",
    category: "Technology",
    date: "Dec 20, 2026",
    location: "Bengaluru",
    price: 699,
    description: "Discover creative solutions shaping tomorrow's world.",
    tag: "EXPO",
    gradient: "from-indigo-600 to-blue-400",
  },
];

const categories = ["All", "Music", "Technology", "Art", "Business"];

export default function EventsPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("default");

  const filteredEvents = useMemo(() => {
    let result = events.filter((event) => {
      const matchesCategory =
        selectedCategory === "All" ||
        event.category === selectedCategory;

      const matchesSearch =
        event.title.toLowerCase().includes(search.toLowerCase()) ||
        event.location.toLowerCase().includes(search.toLowerCase());

      return matchesCategory && matchesSearch;
    });

    if (sort === "low") {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sort === "high") {
      result = [...result].sort((a, b) => b.price - a.price);
    }

    return result;
  }, [selectedCategory, search, sort]);

  return (
    <main className="min-h-screen bg-[#09090f] text-white">
      <nav className="sticky top-0 z-20 border-b border-white/10 bg-[#09090f]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <Link href="/" className="text-3xl font-black tracking-tight">
            VYBE<span className="text-violet-500">.</span>
          </Link>

          <div className="flex items-center gap-5 text-sm">
            <Link href="/" className="text-zinc-400 hover:text-white">
              Home
            </Link>
            <Link href="/profile" className="text-zinc-400 hover:text-white">
              Profile
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-violet-600 px-5 py-2.5 font-semibold hover:bg-violet-500"
            >
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-5 pb-12 pt-16">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-violet-400">
          Find your next experience
        </p>

        <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">
          Discover <span className="text-violet-500">events.</span>
          <br />
          Make memories.
        </h1>

        <p className="mt-5 max-w-xl text-zinc-400">
          From live music to technology conferences, find experiences
          worth remembering.
        </p>

        <div className="mt-10 grid gap-4 rounded-2xl border border-white/10 bg-[#12121b] p-4 sm:grid-cols-[1fr_220px]">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events or locations..."
            className="w-full rounded-xl border border-white/10 bg-[#09090f] px-5 py-4 text-sm outline-none placeholder:text-zinc-500 focus:border-violet-500"
          />

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-xl border border-white/10 bg-[#09090f] px-4 py-4 text-sm text-zinc-300 outline-none focus:border-violet-500"
          >
            <option value="default">Sort: Recommended</option>
            <option value="low">Price: Low to high</option>
            <option value="high">Price: High to low</option>
          </select>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-5">
          <div>
            <h2 className="text-2xl font-bold">Explore events</h2>
            <p className="mt-2 text-sm text-zinc-500">
              {filteredEvents.length} events found
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  selectedCategory === category
                    ? "bg-violet-600 text-white"
                    : "border border-white/10 text-zinc-400 hover:border-violet-500 hover:text-white"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {filteredEvents.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <article
                key={event.id}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-[#12121b] transition hover:-translate-y-1 hover:border-violet-500/50"
              >
                <div
                  className={`relative flex h-48 items-center justify-center bg-gradient-to-br ${event.gradient}`}
                >
                  <span className="text-5xl font-black text-white/20">
                    VYBE
                  </span>
                  <span className="absolute left-4 top-4 rounded-full bg-black/30 px-3 py-1 text-xs font-bold tracking-wider backdrop-blur">
                    {event.tag}
                  </span>
                  <span className="absolute bottom-4 right-4 rounded-full bg-black/30 px-3 py-1 text-xs font-semibold backdrop-blur">
                    {event.category}
                  </span>
                </div>

                <div className="p-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">
                    {event.date} · {event.location}
                  </p>

                  <h3 className="mt-3 text-xl font-bold transition group-hover:text-violet-300">
                    {event.title}
                  </h3>

                  <p className="mt-3 min-h-12 text-sm leading-6 text-zinc-400">
                    {event.description}
                  </p>

                  <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
                    <div>
                      <p className="text-xs text-zinc-500">Starting from</p>
                      <p className="mt-1 text-lg font-bold">
                        ₹{event.price.toLocaleString("en-IN")}
                      </p>
                    </div>

                    <Link
                      href={`/events/${event.id}`}
                      className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold transition hover:bg-violet-500"
                    >
                      View event →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-[#12121b] px-6 py-20 text-center">
            <h3 className="text-xl font-bold">No events found</h3>
            <p className="mt-3 text-sm text-zinc-400">
              Try another search term or category.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setSelectedCategory("All");
                setSort("default");
              }}
              className="mt-6 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold hover:bg-violet-500"
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      <footer className="border-t border-white/10 px-5 py-8 text-center text-sm text-zinc-600">
        © 2026 VYBE. Find your people. Feel the moment.
      </footer>
    </main>
  );
}
