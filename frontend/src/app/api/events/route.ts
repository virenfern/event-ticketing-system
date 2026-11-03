import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [rows] = await pool.query(
      `SELECT e.event_id, e.event_name, e.event_date, e.event_time,
              e.base_price, e.status, v.name AS venue_name, v.city
       FROM events e
       JOIN venues v ON v.venue_id = e.venue_id
       ORDER BY e.event_date`
    );
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}