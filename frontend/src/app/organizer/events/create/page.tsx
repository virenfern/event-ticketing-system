
"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Venue {
  venue_id: number;
  venue_name: string;
  address: string;
  city: string;
  capacity: number;
}

export default function CreateEventPage() {
  const router = useRouter();

  const [venues, setVenues] = useState<Venue[]>([]);
  const [today, setToday] = useState("");
  const [loadingVenues, setLoadingVenues] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    venueId: "",
    eventName: "",
    eventDate: "",
    eventTime: "",
    endTime: "",
    category: "Music",
    description: "",
    basePrice: "",
    rows: "5",
    seatsPerRow: "10",
    seatType: "standard",
  });

  useEffect(() => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");

    setToday(`${year}-${month}-${day}`);

    async function loadVenues() {
      try {
        const response = await fetch("/api/venues");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Could not load venues");
        }

        setVenues(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not load venues"
        );
      } finally {
        setLoadingVenues(false);
      }
    }

    loadVenues();
  }, []);

  function updateField(field: keyof typeof form, value: string) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!form.venueId) {
      setError("Please select a venue.");
      return;
    }

    if (!form.eventName.trim()) {
      setError("Please enter an event name.");
      return;
    }

    if (form.eventDate < today) {
      setError("Event date cannot be in the past.");
      return;
    }

    if (form.endTime <= form.eventTime) {
      setError("End time must be later than start time.");
      return;
    }

    const rows = Number(form.rows);
    const seatsPerRow = Number(form.seatsPerRow);
    const seatCount = rows * seatsPerRow;
    const basePrice = Number(form.basePrice);

    if (
      !Number.isInteger(rows) ||
      !Number.isInteger(seatsPerRow) ||
      rows < 1 ||
      seatsPerRow < 1 ||
      seatCount > 2000
    ) {
      setError("Enter valid seating dimensions (maximum 2000 seats).");
      return;
    }

    if (!Number.isFinite(basePrice) || basePrice < 0) {
      setError("Please enter a valid ticket price.");
      return;
    }

    const selectedVenue = venues.find(
      (venue) => venue.venue_id === Number(form.venueId)
    );

    if (selectedVenue && seatCount > selectedVenue.capacity) {
      setError(
        `Seat count cannot exceed venue capacity (${selectedVenue.capacity}).`
      );
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          venueId: Number(form.venueId),
          eventName: form.eventName.trim(),
          category: form.category,
          description: form.description,
          eventDate: form.eventDate,
          eventTime: form.eventTime,
          endTime: form.endTime,
          basePrice,
          seatLayout: [
            {
              section: "GENERAL",
              rows,
              seatsPerRow,
              seatType: form.seatType,
              price: basePrice,
            },
          ],
          content: {
            description: form.description,
            tags: [form.category.toLowerCase()],
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Event creation failed");
      }

      setSuccess(
        `Event created successfully! Event ID: ${data.eventId}. ${data.seatsCreated} seats generated.`
      );

      setTimeout(() => {
        router.push("/organizer/dashboard");
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/organizer/dashboard"
          className="text-purple-400 hover:text-purple-300"
        >
          ← Back to Dashboard
        </Link>

        <h1 className="text-3xl font-bold mt-6">
          Create New Event
        </h1>

        <p className="text-gray-400 mt-2 mb-8">
          Enter event details and configure your seating layout.
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6"
        >
          <div>
            <label className="block text-sm mb-2">
              Event Name
            </label>

            <input
              required
              maxLength={200}
              value={form.eventName}
              onChange={(e) => updateField("eventName", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3"
              placeholder="e.g. Summer Music Festival"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">
              Category
            </label>

            <select
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3"
            >
              <option>Music</option>
              <option>Technology</option>
              <option>Business</option>
              <option>Sports</option>
              <option>Education</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2">
              Event Description
            </label>

            <textarea
              rows={4}
              maxLength={5000}
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3"
              placeholder="Describe your event..."
            />
          </div>

          <div>
            <label className="block text-sm mb-2">
              Venue
            </label>

            <select
              required
              value={form.venueId}
              onChange={(e) => updateField("venueId", e.target.value)}
              disabled={loadingVenues}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3"
            >
              <option value="">
                {loadingVenues ? "Loading venues..." : "Select a venue"}
              </option>

              {venues.map((venue) => (
                <option key={venue.venue_id} value={venue.venue_id}>
                  {venue.venue_name} — {venue.city} (Capacity: {venue.capacity})
                </option>
              ))}
            </select>

            {!loadingVenues && venues.length === 0 && (
              <p className="text-sm text-red-400 mt-2">
                No venues available.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm mb-2">
                Event Date
              </label>

              <input
                type="date"
                required
                min={today || undefined}
                value={form.eventDate}
                onChange={(e) => updateField("eventDate", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">
                Base Ticket Price (₹)
              </label>

              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={form.basePrice}
                onChange={(e) => updateField("basePrice", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3"
                placeholder="e.g. 999"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">
                Start Time
              </label>

              <input
                type="time"
                required
                value={form.eventTime}
                onChange={(e) => updateField("eventTime", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">
                End Time
              </label>

              <input
                type="time"
                required
                value={form.endTime}
                onChange={(e) => updateField("endTime", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3"
              />
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6">
            <h2 className="text-lg font-semibold mb-4">
              Seating Configuration
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm mb-2">
                  Rows
                </label>

                <input
                  type="number"
                  min="1"
                  max="2000"
                  required
                  value={form.rows}
                  onChange={(e) => updateField("rows", e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">
                  Seats per Row
                </label>

                <input
                  type="number"
                  min="1"
                  max="2000"
                  required
                  value={form.seatsPerRow}
                  onChange={(e) => updateField("seatsPerRow", e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">
                  Seat Type
                </label>

                <select
                  value={form.seatType}
                  onChange={(e) => updateField("seatType", e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3"
                >
                  <option value="standard">Regular</option>
                  <option value="premium">Premium</option>
                  <option value="vip">VIP</option>
                </select>
              </div>
            </div>

            <p className="text-sm text-gray-400 mt-3">
              Total seats to generate:{" "}
              {Number(form.rows || 0) * Number(form.seatsPerRow || 0)}
            </p>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-300 p-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-900/30 border border-green-700 text-green-300 p-3 rounded-lg">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={
              submitting ||
              loadingVenues ||
              venues.length === 0
            }
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 py-3 rounded-lg font-semibold"
          >
            {submitting ? "Creating Event..." : "Create Event"}
          </button>
        </form>
      </div>
    </main>
  );
}
