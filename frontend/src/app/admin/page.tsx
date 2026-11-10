"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface DashboardData {
  users: {
    total_users: number;
    attendees: number;
    organizers: number;
    administrators: number;
  };
  events: {
    total_events: number;
    published_events: number;
    cancelled_events: number;
  };
  recentUsers: {
    user_id: number;
    full_name: string;
    email: string;
    role: string;
    account_status: string;
    created_at: string;
  }[];
  recentEvents: {
    event_id: number;
    event_name: string;
    category: string;
    status: string;
    start_datetime: string;
  }[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await fetch("/api/admin/dashboard");
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to load dashboard");
        }

        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        Loading admin dashboard...
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-gray-950 text-white p-10">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <p className="text-red-400">{error || "No dashboard data available"}</p>
        <Link href="/login" className="text-purple-400 mt-4 inline-block">
          Return to login
        </Link>
      </main>
    );
  }

  const stats = [
    { label: "Total Users", value: data.users.total_users },
    { label: "Attendees", value: data.users.attendees },
    { label: "Organizers", value: data.users.organizers },
    { label: "Administrators", value: data.users.administrators },
    { label: "Total Events", value: data.events.total_events },
    { label: "Published Events", value: data.events.published_events },
    { label: "Cancelled Events", value: data.events.cancelled_events },
  ];

  return (
    <main className="min-h-screen bg-gray-950 text-white px-6 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <p className="text-sm text-purple-400 font-semibold mb-2">VYBE ADMIN</p>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-400 mt-2">
            Monitor users, events and platform activity.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6"
            >
              <p className="text-gray-400 text-sm">{stat.label}</p>
              <p className="text-2xl font-bold mt-3">{stat.value ?? 0}</p>
            </div>
          ))}
        </div>

        <section className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-semibold">Recent Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-800/70 text-gray-300">
                <tr>
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Account Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentUsers.map((user) => (
                  <tr key={user.user_id} className="border-t border-gray-800">
                    <td className="p-4">{user.full_name}</td>
                    <td className="p-4">{user.email}</td>
                    <td className="p-4">{user.role}</td>
                    <td className="p-4">{user.account_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-semibold">Recent Events</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-800/70 text-gray-300">
                <tr>
                  <th className="p-4">Event</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Start Date</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentEvents.map((event) => (
                  <tr key={event.event_id} className="border-t border-gray-800">
                    <td className="p-4">{event.event_name}</td>
                    <td className="p-4">{event.category}</td>
                    <td className="p-4">
                      {new Date(event.start_datetime).toLocaleString("en-IN")}
                    </td>
                    <td className="p-4">{event.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-8">
          <Link href="/" className="text-purple-400 hover:text-purple-300">
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
