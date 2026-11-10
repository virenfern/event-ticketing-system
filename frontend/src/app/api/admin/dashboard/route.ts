import { pool } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);

  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  if (user.role !== "admin") {
    return NextResponse.json({ error: "Administrators only" }, { status: 403 });
  }

  try {
    const [userCounts] = await pool.query(`
      SELECT
        COUNT(*) AS total_users,
        SUM(role = 'ATTENDEE') AS attendees,
        SUM(role = 'ORGANIZER') AS organizers,
        SUM(role = 'ADMIN') AS administrators
      FROM users
    `);

    const [eventCounts] = await pool.query(`
      SELECT
        COUNT(*) AS total_events,
        SUM(status = 'PUBLISHED') AS published_events,
        SUM(status = 'CANCELLED') AS cancelled_events
      FROM events
    `);

    const [recentUsers] = await pool.query(`
      SELECT user_id, full_name, email, role, account_status, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 10
    `);

    const [recentEvents] = await pool.query(`
      SELECT event_id, event_name, category, status, start_datetime
      FROM events
      ORDER BY created_at DESC
      LIMIT 10
    `);

    return NextResponse.json({
      users: (userCounts as any[])[0],
      events: (eventCounts as any[])[0],
      recentUsers,
      recentEvents
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to load admin dashboard" },
      { status: 500 }
    );
  }
}
