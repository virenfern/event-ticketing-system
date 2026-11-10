
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Seat {
  seat_id: number;
  section: string;
  row_no: string;
  seat_no: string;
  seat_type: string;
  price_at_booking: string;
}

interface Booking {
  booking_id: number;
  booking_reference: string;
  event_id: number;
  event_name: string;
  event_date: string;
  event_time: string;
  venue_name: string;
  city: string;
  status: string;
  total_amount: string;
  booking_date: string;
  expires_at: string | null;
  seats: Seat[];
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<Record<number, string>>({});
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  async function fetchBookings() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/bookings", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load bookings");
      }

      setBookings(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBookings();
  }, []);

  // Confirm payment for a pending booking.
  async function confirmPayment(bookingId: number) {
    try {
      setProcessingId(bookingId);
      setMessage("");
      setError("");

      const response = await fetch(
        `/api/bookings/${bookingId}/confirm`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentMethod: paymentMethods[bookingId] || "UPI",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Payment confirmation failed");
      }

      setMessage(`Booking ${bookingId} confirmed successfully!`);
      await fetchBookings();
    } catch (err: any) {
      setError(err.message || "Payment confirmation failed");
    } finally {
      setProcessingId(null);
    }
  }

  // Cancel a pending booking and release its held seats.
  async function cancelBooking(bookingId: number) {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking? Your held seats will be released."
    );

    if (!confirmed) return;

    try {
      setProcessingId(bookingId);
      setMessage("");
      setError("");

      const response = await fetch(
        `/api/bookings/${bookingId}/cancel`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Booking cancellation failed");
      }

      setMessage(`Booking ${bookingId} cancelled successfully!`);
      await fetchBookings();
    } catch (err: any) {
      setError(err.message || "Booking cancellation failed");
    } finally {
      setProcessingId(null);
    }
  }

  function formatDate(date: string) {
    return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function formatTime(time: string) {
    const [hours, minutes] = time.split(":");
    const date = new Date();
    date.setHours(Number(hours), Number(minutes), 0, 0);

    return date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  function isHoldActive(booking: Booking) {
    return (
      booking.status === "PENDING" &&
      booking.expires_at !== null &&
      new Date(booking.expires_at).getTime() > Date.now()
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-300">Loading your bookings...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white px-5 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-purple-400 text-sm font-semibold tracking-widest">
              VYBE
            </p>
            <h1 className="text-3xl font-bold mt-2">My Bookings</h1>
            <p className="text-gray-400 mt-2">
              View your tickets and booking history.
            </p>
          </div>

          <Link
            href="/"
            className="bg-purple-600 hover:bg-purple-700 px-5 py-3 rounded-xl font-semibold"
          >
            Explore Events
          </Link>
        </div>

        {message && (
          <div className="mb-6 rounded-xl bg-green-900/40 border border-green-600 p-4 text-green-300">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl bg-red-900/40 border border-red-600 p-4 text-red-300">
            {error}
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="bg-gray-900 rounded-2xl p-10 text-center border border-gray-800">
            <h2 className="text-xl font-semibold">No bookings yet</h2>
            <p className="text-gray-400 mt-2">
              Your event tickets will appear here.
            </p>
            <Link
              href="/"
              className="inline-block mt-6 bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl"
            >
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => {
              const activeHold = isHoldActive(booking);

              return (
                <div
                  key={booking.booking_id}
                  className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-purple-400 text-sm font-medium">
                          BOOKING #{booking.booking_id}
                        </p>
                        <h2 className="text-2xl font-bold mt-1">
                          {booking.event_name}
                        </h2>
                        <p className="text-gray-400 mt-2">
                          {booking.venue_name}, {booking.city}
                        </p>
                      </div>

                      <span
                        className={`px-4 py-2 rounded-full text-sm font-semibold ${
                          booking.status === "CONFIRMED"
                            ? "bg-green-900/50 text-green-300"
                            : booking.status === "PENDING" && activeHold
                            ? "bg-yellow-900/50 text-yellow-300"
                            : booking.status === "PENDING"
                            ? "bg-red-900/50 text-red-300"
                            : booking.status === "CANCELLED"
                            ? "bg-gray-700 text-gray-300"
                            : "bg-gray-700 text-gray-300"
                        }`}
                      >
                        {booking.status === "PENDING" && !activeHold
                          ? "HOLD EXPIRED"
                          : booking.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                      <div className="bg-gray-800/70 rounded-xl p-4">
                        <p className="text-gray-400 text-sm">Event date</p>
                        <p className="font-semibold mt-1">
                          {formatDate(booking.event_date)}
                        </p>
                      </div>

                      <div className="bg-gray-800/70 rounded-xl p-4">
                        <p className="text-gray-400 text-sm">Event time</p>
                        <p className="font-semibold mt-1">
                          {formatTime(booking.event_time)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h3 className="font-semibold mb-3">Your seats</h3>

                      <div className="space-y-2">
                        {booking.seats.map((seat) => (
                          <div
                            key={seat.seat_id}
                            className="flex flex-wrap justify-between gap-2 bg-gray-800/70 rounded-lg p-3"
                          >
                            <span>
                              {seat.section} · Row {seat.row_no} · Seat{" "}
                              {seat.seat_no}
                            </span>
                            <span className="text-gray-300">
                              ₹{Number(seat.price_at_booking).toLocaleString("en-IN")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-gray-700 mt-6 pt-5 flex flex-wrap justify-between items-center gap-4">
                      <div>
                        <p className="text-gray-400 text-sm">
                          Booking reference
                        </p>
                        <p className="text-sm font-mono mt-1 break-all">
                          {booking.booking_reference}
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-gray-400 text-sm">Total amount</p>
                        <p className="text-2xl font-bold text-purple-400">
                          ₹{Number(booking.total_amount).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>

                    {activeHold && (
                      <div className="mt-6 bg-yellow-900/20 border border-yellow-700 rounded-xl p-4">
                        <p className="text-yellow-300 text-sm mb-3">
                          Your seats are temporarily held. Complete the
                          simulated payment to confirm your booking.
                        </p>

                        <div className="flex flex-wrap gap-3">
                          <select
                            value={paymentMethods[booking.booking_id] || "UPI"}
                            onChange={(e) =>
                              setPaymentMethods((previous) => ({
                                ...previous,
                                [booking.booking_id]: e.target.value,
                              }))
                            }
                            className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white"
                          >
                            <option value="UPI">UPI</option>
                            <option value="CARD">Card</option>
                            <option value="NET_BANKING">Net Banking</option>
                            <option value="WALLET">Wallet</option>
                          </select>

                          <button
                            onClick={() => confirmPayment(booking.booking_id)}
                            disabled={processingId !== null}
                            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-6 py-3 rounded-lg font-semibold"
                          >
                            {processingId === booking.booking_id
                              ? "Processing..."
                              : "Confirm Payment"}
                          </button>

                          <button
                            onClick={() => cancelBooking(booking.booking_id)}
                            disabled={processingId !== null}
                            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 px-6 py-3 rounded-lg font-semibold"
                          >
                            {processingId === booking.booking_id
                              ? "Processing..."
                              : "Cancel Booking"}
                          </button>
                        </div>
                      </div>
                    )}

                    {booking.status === "PENDING" && !activeHold && (
                      <p className="mt-5 text-sm text-red-300">
                        This booking's seat hold has expired. Payment
                        confirmation is no longer available.
                      </p>
                    )}

                    {booking.status === "CANCELLED" && (
                      <div className="mt-5 bg-gray-800 border border-gray-700 rounded-xl p-4 text-gray-300">
                        This booking has been cancelled. Its held seats have
                        been released.
                      </div>
                    )}

                    {booking.status === "CONFIRMED" && (
                      <div className="mt-5 bg-green-900/20 border border-green-700 rounded-xl p-4 text-green-300">
                        Your booking is confirmed. Enjoy the event!
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
