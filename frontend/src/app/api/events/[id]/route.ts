
import { pool } from "@/lib/db";
import { getEventContentCollection } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Validate event ID
  if (!/^\d+$/.test(id) || Number(id) <= 0) {
    return NextResponse.json(
      { error: "Invalid event ID" },
      { status: 400 }
    );
  }

  try {
    // Fetch event using the existing MySQL schema
    const [eventRows]: any = await pool.query(
      `SELECT
          e.event_id,
          e.event_name,
          DATE(e.start_datetime) AS event_date,
          TIME(e.start_datetime) AS event_time,
          e.base_price,
          e.status,
          v.venue_name AS venue_name,
          v.city,
          v.address
       FROM events e
       JOIN venues v ON v.venue_id = e.venue_id
       WHERE e.event_id = ?`,
      [id]
    );

    if (eventRows.length === 0) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Fetch seats using existing column names
    const [seatRows]: any = await pool.query(
      `SELECT
          seat_id,
          section_name AS section,
          row_label AS row_no,
          seat_number AS seat_no,
          CASE seat_type
            WHEN 'REGULAR' THEN 'standard'
            WHEN 'PREMIUM' THEN 'premium'
            WHEN 'VIP' THEN 'vip'
          END AS seat_type,
          price,
          status
       FROM seats
       WHERE event_id = ?
       ORDER BY section_name, row_label, seat_number`,
      [id]
    );

    // Fetch additional event content from MongoDB
    const contentCollection = await getEventContentCollection();

    const content = await contentCollection.findOne(
      { event_id: Number(id) },
      { projection: { _id: 0 } }
    );

    return NextResponse.json({
      event: eventRows[0],
      seats: seatRows,
      content: content ?? null,
    });
  } catch (err: any) {
    console.error("GET /api/events/[id] error:", err.message);

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
