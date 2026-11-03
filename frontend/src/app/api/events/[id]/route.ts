import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const [eventRows]: any = await pool.query(
      `SELECT e.event_id, e.event_name, e.event_date, e.event_time,
              e.base_price, e.status, v.name AS venue_name, v.city, v.address
       FROM events e
       JOIN venues v ON v.venue_id = e.venue_id
       WHERE e.event_id = ?`,
      [id]
    );

    if (eventRows.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const [seatRows] = await pool.query(
      `SELECT seat_id, section, row_no, seat_no, seat_type, price, status
       FROM seats
       WHERE event_id = ?
       ORDER BY section, row_no, seat_no`,
      [id]
    );

    return NextResponse.json({ event: eventRows[0], seats: seatRows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}