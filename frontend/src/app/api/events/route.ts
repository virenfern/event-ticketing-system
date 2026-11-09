import { pool } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { getEventContentCollection } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

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

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  if (user.role !== "organizer") {
    return NextResponse.json({ error: "Organizers only" }, { status: 403 });
  }

  const { venueId, eventName, eventDate, eventTime, basePrice, seatLayout, content } =
    await req.json();

  if (!venueId || !eventName || !eventDate || !eventTime || basePrice === undefined) {
    return NextResponse.json(
      { error: "venueId, eventName, eventDate, eventTime and basePrice are required" },
      { status: 400 }
    );
  }
  if (isNaN(Date.parse(eventDate)) || Number(basePrice) < 0) {
    return NextResponse.json(
      { error: "Invalid eventDate or basePrice" },
      { status: 400 }
    );
  }

  // Build the seat rows up front so bad layouts are rejected before touching the DB
  const seatRows: any[] = [];
  if (Array.isArray(seatLayout)) {
    for (const block of seatLayout) {
      if (!block.section || !(block.rows > 0) || !(block.seatsPerRow > 0)) {
        return NextResponse.json(
          { error: "Each seatLayout block needs section, rows and seatsPerRow" },
          { status: 400 }
        );
      }
      for (let r = 1; r <= block.rows; r++) {
        for (let s = 1; s <= block.seatsPerRow; s++) {
          seatRows.push([
            0, // placeholder, replaced with the real event_id below
            block.section,
            String(r),
            s,
            block.seatType ?? "standard",
            block.price ?? basePrice,
          ]);
        }
      }
    }
  }
  if (seatRows.length > 2000) {
    return NextResponse.json({ error: "Too many seats (max 2000)" }, { status: 400 });
  }

  const conn = await pool.getConnection();
  let eventId: number;

  try {
    await conn.beginTransaction();

    const [orgRows]: any = await conn.query(
      "SELECT organizer_id FROM organizers WHERE user_id = ?",
      [user.userId]
    );
    if (orgRows.length === 0) {
      await conn.rollback();
      return NextResponse.json({ error: "Organizer profile not found" }, { status: 403 });
    }

    const [result]: any = await conn.query(
      `INSERT INTO events (organizer_id, venue_id, event_name, event_date, event_time, base_price)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [orgRows[0].organizer_id, venueId, eventName, eventDate, eventTime, basePrice]
    );
    eventId = result.insertId;

    if (seatRows.length > 0) {
      const withEventId = seatRows.map((row) => [eventId, ...row.slice(1)]);
      await conn.query(
        `INSERT INTO seats (event_id, section, row_no, seat_no, seat_type, price)
         VALUES ?`,
        [withEventId]
      );
    }

    await conn.commit();
  } catch (err: any) {
    await conn.rollback();
    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      return NextResponse.json({ error: "Venue does not exist" }, { status: 400 });
    }
    if (err.code === "ER_CHECK_CONSTRAINT_VIOLATED") {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    conn.release();
  }

  // MongoDB write happens after the SQL commit. If it fails, undo the SQL insert,
  // since the two databases can't share one transaction.
  if (content) {
    try {
      const collection = await getEventContentCollection();
      await collection.insertOne({
        event_id: eventId,
        description: content.description ?? "",
        banner_url: content.bannerUrl ?? "",
        tags: Array.isArray(content.tags) ? content.tags : [],
        artists: Array.isArray(content.artists) ? content.artists : [],
        faqs: Array.isArray(content.faqs) ? content.faqs : [],
      });
    } catch (err: any) {
      await pool.query("DELETE FROM events WHERE event_id = ?", [eventId]);
      return NextResponse.json(
        { error: "Failed to save event content, event was not created" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ eventId, seatsCreated: seatRows.length }, { status: 201 });
}