
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface DashboardEvent {
  organizer_id: number;
  event_id: number;
  event_name: string;
  category: string;
  event_status: string;
  event_date: string;
  event_time: string;
  venue_name: string;
  city: string;
  confirmed_bookings: number;
  tickets_sold: number;
  total_revenue: number;
}

export default function OrganizerDashboard() {
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await fetch("/api/organizer/dashboard");

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to load dashboard");
        }

        const data = await response.json();
        setEvents(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const totalEvents = events.length;
  const totalBookings = events.reduce(
    (sum, event) => sum + Number(event.confirmed_bookings || 0),
    0
  );
  const totalTickets = events.reduce(
    (sum, event) => sum + Number(event.tickets_sold || 0),
    0
  );
  const totalRevenue = events.reduce(
    (sum, event) => sum + Number(event.total_revenue || 0),
    0
  );

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        Loading organizer dashboard...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white px-6 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <p className="text-sm text-purple-400 font-semibold mb-2">
              VYBE ORGANIZER
            </p>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-400 mt-2">
              Manage your events and track ticket sales.
            </p>
          </div>

          <Link
            href="/organizer/events/create"
            className="bg-purple-600 hover:bg-purple-700 px-5 py-3 rounded-lg font-semibold text-center"
          >
            + Create Event
          </Link>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {[
            { label: "Total Events", value: totalEvents },
            { label: "Confirmed Bookings", value: totalBookings },
            { label: "Tickets Sold", value: totalTickets },
            { label: "Total Revenue", value: formatCurrency(totalRevenue) },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6"
            >
              <p className="text-gray-400 text-sm">{stat.label}</p>
              <p className="text-2xl font-bold mt-3">{stat.value}</p>
            </div>
          ))}
        </div>

        <section className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-semibold">Your Events</h2>
            <p className="text-sm text-gray-400 mt-1">
              Event performance and ticket sales
            </p>
          </div>

          {events.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-lg font-semibold mb-2">
                No events created yet
              </h3>
              <p className="text-gray-400 mb-5">
                Create your first event to start tracking bookings and revenue.
              </p>
              <Link
                href="/organizer/events/create"
                className="inline-block bg-purple-600 hover:bg-purple-700 px-5 py-3 rounded-lg font-semibold"
              >
                Create Your First Event
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-800/70 text-gray-300">
                  <tr>
                    <th className="p-4">Event</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Venue</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Bookings</th>
                    <th className="p-4">Tickets</th>
                    <th className="p-4">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr
                      key={event.event_id}
                      className="border-t border-gray-800"
                    >
                      <td className="p-4">
                        <p className="font-semibold">{event.event_name}</p>
                        <p className="text-gray-400">{event.category}</p>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {formatDate(event.event_date)}
                      </td>
                      <td className="p-4">
                        {event.venue_name}, {event.city}
                      </td>
                      <td className="p-4">{event.event_status}</td>
                      <td className="p-4">{event.confirmed_bookings}</td>
                      <td className="p-4">{event.tickets_sold}</td>
                      <td className="p-4 whitespace-nowrap">
                        {formatCurrency(Number(event.total_revenue))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="mt-8">
          <Link href="/" className="text-purple-400 hover:text-purple-300">
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
