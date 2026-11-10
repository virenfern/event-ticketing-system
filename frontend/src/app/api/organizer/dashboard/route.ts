
import { pool } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);

  if (!user) {
    return NextResponse.json(
      { error: "Not logged in" },
      { status: 401 }
    );
  }

  if (user.role !== "organizer") {
    return NextResponse.json(
      { error: "Organizers only" },
      { status: 403 }
    );
  }

  try {
    const [rows] = await pool.query(
      `SELECT *
       FROM organizer_sales_dashboard
       WHERE organizer_id = ?
       ORDER BY event_date ASC`,
      [user.userId]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Organizer dashboard error:", error);

    return NextResponse.json(
      { error: "Failed to load organizer dashboard" },
      { status: 500 }
    );
  }
}
