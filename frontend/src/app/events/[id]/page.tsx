
"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type EventData = {
  event_id: number;
  event_name: string;
  event_date: string;
  event_time: string;
  base_price: string;
  status: string;
  venue_name: string;
  city: string;
  address: string;
};

type Seat = {
  seat_id: number;
  section: string;
  row_no: string;
  seat_no: string;
  seat_type: string;
  price: string;
  status: string;
};

type EventContent = {
  description?: string;
  banner_url?: string;
  tags?: string[];
  artists?: {
    name: string;
    bio?: string;
    photo_url?: string;
  }[];
  faqs?: {
    question: string;
    answer: string;
  }[];
};

type EventResponse = {
  event: EventData;
  seats: Seat[];
  content: EventContent | null;
};

const MAX_SEATS = 10;

const gradients: Record<string, string> = {
  Music: "from-purple-600 to-pink-500",
  Technology: "from-blue-600 to-cyan-500",
  Art: "from-orange-500 to-rose-500",
  Business: "from-emerald-600 to-teal-400",
  Other: "from-indigo-600 to-purple-500",
};

function formatDate(date: string) {
  const parsed = new Date(`${date.slice(0, 10)}T00:00:00`);

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();

  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function EventDetailsContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [data, setData] = useState<EventResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingMessage, setBookingMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadEvent() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/events/${id}`, {
          signal: controller.signal,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Unable to load event");
        }

        setData(result);
        setSelectedSeatIds([]);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadEvent();

    return () => controller.abort();
  }, [id]);

  function toggleSeat(seat: Seat) {
    if (seat.status !== "AVAILABLE" || bookingLoading) {
      return;
    }

    setBookingError("");
    setBookingMessage("");

    setSelectedSeatIds((current) => {
      if (current.includes(seat.seat_id)) {
        return current.filter((id) => id !== seat.seat_id);
      }

      if (current.length >= MAX_SEATS) {
        setBookingError(`You can select a maximum of ${MAX_SEATS} seats.`);
        return current;
      }

      return [...current, seat.seat_id];
    });
  }

  async function handleBooking() {
    if (!selectedSeatIds.length) {
      setBookingError("Please select at least one seat.");
      return;
    }

    setBookingLoading(true);
    setBookingError("");
    setBookingMessage("");

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          eventId: Number(id),
          seatIds: selectedSeatIds,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to complete your booking."
        );
      }

      // Ensure the API returned a valid booking ID.
      if (!result.bookingId) {
        throw new Error(
          "Booking was created, but the booking ID was not returned."
        );
      }

      // Booking created successfully. Navigate to My Bookings
      // where the attendee can confirm the simulated payment.
      router.push("/bookings");
    } catch (err) {
      setBookingError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );

      setBookingLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#09090f] text-white">
        <p className="animate-pulse text-lg text-violet-300">
          Loading event details...
        </p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#09090f] px-5 text-center text-white">
        <h1 className="text-3xl font-bold">
          {error === "Event not found"
            ? "Event not found"
            : "Unable to load event"}
        </h1>

        <p className="mt-3 text-zinc-400">
          {error || "Something went wrong. Please try again."}
        </p>

        <Link
          href="/"
          className="mt-6 rounded-xl bg-violet-600 px-6 py-3 font-semibold hover:bg-violet-500"
        >
          Back to home
        </Link>
      </main>
    );
  }

  const { event, seats, content } = data;

  const category = content?.tags?.[0]
    ? content.tags[0].charAt(0).toUpperCase() +
      content.tags[0].slice(1)
    : "Other";

  const gradient = gradients[category] || gradients.Other;

  const availableSeats = seats.filter(
    (seat) => seat.status === "AVAILABLE"
  );

  const selectedSeats = seats.filter((seat) =>
    selectedSeatIds.includes(seat.seat_id)
  );

  const selectedTotal = selectedSeats.reduce(
    (sum, seat) => sum + Number(seat.price),
    0
  );

  const lowestPrice =
    seats.length > 0
      ? Math.min(...seats.map((seat) => Number(seat.price)))
      : Number(event.base_price);

  const groupedSeats = seats.reduce<Record<string, Seat[]>>(
    (groups, seat) => {
      if (!groups[seat.section]) {
        groups[seat.section] = [];
      }

      groups[seat.section].push(seat);
      return groups;
    },
    {}
  );

  return (
    <main className="min-h-screen bg-[#09090f] text-white">
      {/* Navigation */}
      <nav className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <Link href="/" className="text-3xl font-black">
            VYBE<span className="text-violet-500">.</span>
          </Link>

          <Link
            href="/"
            className="text-sm text-zinc-400 hover:text-white"
          >
            ← All events
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-5 py-12">
        {/* Event Banner */}
        <div
          className={`relative flex h-64 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} sm:h-96`}
          style={
            content?.banner_url
              ? {
                  backgroundImage: `linear-gradient(#0005, #0005), url("${content.banner_url}")`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          <span className="text-6xl font-black tracking-widest text-white/30 sm:text-8xl">
            VYBE
          </span>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
          {/* Main Event Information */}
          <div>
            <span className="rounded-full bg-violet-500/15 px-4 py-2 text-xs font-semibold text-violet-300">
              {category}
            </span>

            <h1 className="mt-6 text-3xl font-black leading-tight sm:text-5xl">
              {event.event_name}
            </h1>

            <p className="mt-6 text-base leading-8 text-zinc-400">
              {content?.description || "Event description coming soon."}
            </p>

            {/* Date, Time and Venue */}
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-[#12121b] p-5">
                <p className="text-sm text-zinc-500">Date</p>
                <p className="mt-2 font-semibold">
                  {formatDate(event.event_date)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#12121b] p-5">
                <p className="text-sm text-zinc-500">Time</p>
                <p className="mt-2 font-semibold">
                  {formatTime(event.event_time)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#12121b] p-5 sm:col-span-2">
                <p className="text-sm text-zinc-500">Venue</p>
                <p className="mt-2 font-semibold">
                  {event.venue_name}
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  {event.address}, {event.city}
                </p>
              </div>
            </div>

            {/* Event Tags */}
            {content?.tags && content.tags.length > 0 && (
              <div className="mt-10">
                <h2 className="text-xl font-bold">Event Tags</h2>

                <div className="mt-4 flex flex-wrap gap-3">
                  {content.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm text-violet-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Artists */}
            {content?.artists && content.artists.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold">
                  Artists & Performers
                </h2>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  {content.artists.map((artist, index) => (
                    <div
                      key={`${artist.name}-${index}`}
                      className="rounded-2xl border border-white/10 bg-[#12121b] p-5"
                    >
                      <h3 className="text-lg font-bold">
                        {artist.name}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-zinc-400">
                        {artist.bio || "Artist information coming soon."}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interactive Seat Selection */}
            <div className="mt-12" id="seat-selection">
              <h2 className="text-2xl font-bold">
                Select Your Seats
              </h2>

              <p className="mt-2 text-sm text-zinc-400">
                Click available seats to select them. Maximum {MAX_SEATS} seats per booking.
              </p>

              <p className="mt-2 text-sm text-zinc-400">
                {availableSeats.length} of {seats.length} seats available
              </p>

              {Object.entries(groupedSeats).map(
                ([section, sectionSeats]) => (
                  <div
                    key={section}
                    className="mt-5 rounded-2xl border border-white/10 bg-[#12121b] p-5"
                  >
                    <h3 className="font-bold">{section}</h3>

                    <div className="mt-4 flex flex-wrap gap-3">
                      {sectionSeats.map((seat) => {
                        const isSelected = selectedSeatIds.includes(
                          seat.seat_id
                        );

                        const isAvailable =
                          seat.status === "AVAILABLE";

                        return (
                          <button
                            key={seat.seat_id}
                            type="button"
                            disabled={!isAvailable || bookingLoading}
                            onClick={() => toggleSeat(seat)}
                            title={`Row ${seat.row_no}, Seat ${seat.seat_no} - ${isSelected ? "Selected" : seat.status}`}
                            aria-pressed={isSelected}
                            className={`flex h-12 w-12 items-center justify-center rounded-lg border text-xs font-semibold transition ${
                              isSelected
                                ? "border-violet-400 bg-violet-600 text-white ring-2 ring-violet-300"
                                : seat.status === "AVAILABLE"
                                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:border-emerald-300 hover:bg-emerald-500/30"
                                  : seat.status === "HELD"
                                    ? "cursor-not-allowed border-amber-500/40 bg-amber-500/10 text-amber-300 opacity-70"
                                    : "cursor-not-allowed border-red-500/40 bg-red-500/10 text-red-300 opacity-70"
                            }`}
                          >
                            {seat.row_no}{seat.seat_no}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )
              )}

              <div className="mt-5 flex flex-wrap gap-5 text-xs text-zinc-400">
                <span>🟢 Available</span>
                <span>🟣 Selected</span>
                <span>🟡 Held</span>
                <span>🔴 Booked</span>
              </div>

              <p className="mt-5 text-sm text-zinc-400">
                Selected: {selectedSeatIds.length} / {MAX_SEATS} seats
              </p>
            </div>

            {/* FAQs */}
            {content?.faqs && content.faqs.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold">
                  Frequently Asked Questions
                </h2>

                <div className="mt-5 space-y-4">
                  {content.faqs.map((faq, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-white/10 bg-[#12121b] p-5"
                    >
                      <h3 className="font-semibold">
                        {faq.question}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking Summary */}
          <aside className="h-fit rounded-3xl border border-white/10 bg-[#12121b] p-7 lg:sticky lg:top-8">
            <p className="text-sm text-zinc-400">
              Tickets starting from
            </p>

            <p className="mt-2 text-4xl font-black">
              ₹{lowestPrice.toLocaleString("en-IN")}
            </p>

            <p className="mt-2 text-xs text-zinc-500">
              Price per ticket
            </p>

            <div className="my-7 border-t border-white/10" />

            <div className="space-y-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-zinc-400">Event</span>
                <span className="text-right font-medium">
                  {event.event_name}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-zinc-400">Location</span>
                <span>{event.city}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-400">Available seats</span>
                <span>{availableSeats.length}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-400">Selected seats</span>
                <span>{selectedSeatIds.length}</span>
              </div>
            </div>

            {selectedSeats.length > 0 && (
              <div className="mt-6 rounded-xl bg-violet-500/10 p-4">
                <p className="text-sm font-semibold text-violet-300">
                  Your selection
                </p>

                <div className="mt-3 space-y-2">
                  {selectedSeats.map((seat) => (
                    <div
                      key={seat.seat_id}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-zinc-300">
                        {seat.section} - {seat.row_no}{seat.seat_no}
                      </span>
                      <span>
                        ₹{Number(seat.price).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex justify-between border-t border-violet-500/20 pt-3 font-bold">
                  <span>Total</span>
                  <span>
                    ₹{selectedTotal.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            )}

            <div className="my-7 border-t border-white/10" />

            <p className="text-sm text-zinc-400">
              Event status
            </p>

            <p className="mt-2 font-semibold text-emerald-400">
              {event.status}
            </p>

            {bookingError && (
              <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                {bookingError}
              </div>
            )}

            {bookingMessage && (
              <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm leading-6 text-emerald-300">
                {bookingMessage}
              </div>
            )}

            <button
              type="button"
              disabled={
                selectedSeatIds.length === 0 ||
                bookingLoading ||
                event.status !== "PUBLISHED"
              }
              onClick={handleBooking}
              className="mt-8 w-full rounded-xl bg-violet-600 py-4 text-sm font-bold transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-zinc-700"
            >
              {bookingLoading
                ? "Processing booking..."
                : selectedSeatIds.length > 0
                  ? "Book selected seats →"
                  : "Select seats to continue"}
            </button>

            <p className="mt-4 text-center text-xs leading-5 text-zinc-500">
              Selected seats will be held for 10 minutes. Complete payment before the hold expires.
            </p>
          </aside>
        </div>
      </section>

      <footer className="border-t border-white/10 px-5 py-8 text-center text-sm text-zinc-600">
        © 2026 VYBE. Find your people. Feel the moment.
      </footer>
    </main>
  );
}

export default function EventDetailsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#09090f] text-white">
          <p className="animate-pulse text-violet-300">
            Loading VYBE...
          </p>
        </main>
      }
    >
      <EventDetailsContent />
    </Suspense>
  );
}
