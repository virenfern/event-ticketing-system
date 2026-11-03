import { pool } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);

  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  if (user.role !== "organizer") {
    return NextResponse.json({ error: "Organizers only" }, { status: 403 });
  }

  const [rows] = await pool.query(
    `SELECT d.* FROM organizer_sales_dashboard d
     JOIN events e ON e.event_id = d.event_id
     JOIN organizers o ON o.organizer_id = e.organizer_id
     WHERE o.user_id = ?`,
    [user.userId]
  );

  return NextResponse.json(rows);
}