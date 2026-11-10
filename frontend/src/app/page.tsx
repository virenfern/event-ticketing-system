
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Event = {
  event_id: number;
  event_name: string;
  event_date: string;
  event_time: string;
  base_price: number | string;
  status: string;
  venue_name: string;
  city: string;
  tags?: string[];
};

type EventTag = {
  tag: string;
  eventCount: number;
  eventIds: number[];
};

function formatDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getEventIcon(category: string) {
  const value = category.toLowerCase();

  if (value.includes("music")) return "🎵";
  if (value.includes("tech")) return "💻";
  if (value.includes("art")) return "🎨";
  if (value.includes("business")) return "🚀";
  if (value.includes("sport")) return "⚽";
  return "🎟️";
}

function getEventColor(category: string) {
  const value = category.toLowerCase();

  if (value.includes("music")) return "from-purple-600/50 to-pink-500/20";
  if (value.includes("tech")) return "from-blue-600/50 to-cyan-500/20";
  if (value.includes("art")) return "from-orange-600/50 to-pink-500/20";
  if (value.includes("business")) return "from-emerald-600/50 to-teal-500/20";
  return "from-violet-600/50 to-indigo-500/20";
}

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [tags, setTags] = useState<EventTag[]>([]);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load events and available tags.
  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        setError("");

        const [eventsResponse, tagsResponse] = await Promise.all([
          fetch("/api/events"),
          fetch("/api/events/tags"),
        ]);

        if (!eventsResponse.ok) {
          throw new Error("Unable to load events.");
        }

        const eventsData = await eventsResponse.json();
        const tagsData = await tagsResponse.json();

        if (!Array.isArray(eventsData)) {
          throw new Error("Invalid events response from server.");
        }

        setEvents(eventsData);
        setTags(Array.isArray(tagsData) ? tagsData : []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  // Search through MongoDB when the user enters a search term.
  useEffect(() => {
    const query = search.trim();

    if (!query) return;

    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/events/search?q=${encodeURIComponent(query)}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Event search failed.");
        }

        if (!Array.isArray(data)) {
          throw new Error("Invalid search response from server.");
        }

        setEvents(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Search failed."
        );
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [search]);

  // Apply the selected tag to the current event results.
  const filteredEvents = useMemo(() => {
    if (category === "All") return events;

    const selectedTag = tags.find(
      (item) => item.tag === category
    );

    if (!selectedTag) return [];

    const allowedIds = new Set(selectedTag.eventIds);
    return events.filter((event) => allowedIds.has(event.event_id));
  }, [events, category, tags]);

  const categories = [
    "All",
    ...tags.map((item) => item.tag),
  ];

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
                placeholder="Search events..."
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
            <span>Discover experiences with VYBE</span>
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

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-[#12121b] py-20 text-center text-zinc-400">
            Loading events...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/20 bg-[#12121b] py-20 text-center">
            <h3 className="text-xl font-bold text-red-400">
              Unable to load events
            </h3>
            <p className="mt-2 text-sm text-zinc-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 rounded-xl bg-violet-600 px-5 py-2 text-sm font-semibold"
            >
              Try again
            </button>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filteredEvents.map((event) => {
              const eventCategory = event.tags?.[0] || "Event";

              return (
                <article
                  key={event.event_id}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-[#12121b] transition duration-300 hover:-translate-y-1 hover:border-violet-500/50"
                >
                  <div
                    className={`relative flex h-48 items-center justify-center bg-gradient-to-br ${getEventColor(eventCategory)}`}
                  >
                    <span className="text-7xl transition duration-300 group-hover:scale-110">
                      {getEventIcon(eventCategory)}
                    </span>

                    <span className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs backdrop-blur">
                      {eventCategory}
                    </span>
                  </div>

                  <div className="p-5">
                    <p className="text-xs text-violet-400">
                      {formatDate(event.event_date)}
                    </p>

                    <h3 className="mt-2 text-lg font-bold transition group-hover:text-violet-300">
                      {event.event_name}
                    </h3>

                    <p className="mt-2 text-sm text-zinc-500">
                      {event.venue_name}
                    </p>

                    <p className="mt-4 text-xs text-zinc-400">
                      📍 {event.city}
                    </p>

                    <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                      <div>
                        <p className="text-xs text-zinc-500">Starting from</p>
                        <p className="text-lg font-bold">
                          ₹{Number(event.base_price).toLocaleString("en-IN")}
                        </p>
                      </div>

                      <Link
                        href={`/events/${event.event_id}`}
                        className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-violet-600"
                      >
                        View event
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
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
            More than tickets.{" "}
            <span className="text-violet-400">Experiences.</span>
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
