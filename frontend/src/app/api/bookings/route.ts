import { pool } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const HOLD_MINUTES = 10;
const MAX_SEATS_PER_BOOKING = 10;

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  if (user.role !== "attendee") {
    return NextResponse.json({ error: "Attendees only" }, { status: 403 });
  }

  try {
    const { eventId, seatIds } = await req.json();

    if (
      !Number.isInteger(eventId) ||
      !Array.isArray(seatIds) ||
      seatIds.length === 0 ||
      seatIds.length > MAX_SEATS_PER_BOOKING ||
      !seatIds.every((s: unknown) => Number.isInteger(s))
    ) {
      return NextResponse.json(
        { error: `eventId and 1-${MAX_SEATS_PER_BOOKING} integer seatIds are required` },
        { status: 400 }
      );
    }

    const [attendeeRows]: any = await pool.query(
      "SELECT attendee_id FROM attendees WHERE user_id = ?",
      [user.userId]
    );
    if (attendeeRows.length === 0) {
      return NextResponse.json({ error: "Attendee profile not found" }, { status: 403 });
    }

    const conn = await pool.getConnection();
    try {
      await conn.query("CALL hold_seats(?, ?, ?, ?, @booking_id)", [
        attendeeRows[0].attendee_id,
        eventId,
        seatIds.join(","),
        HOLD_MINUTES,
      ]);
      const [[result]]: any = await conn.query("SELECT @booking_id AS booking_id");
      const bookingId = result.booking_id;

      if (bookingId === -1) {
        return NextResponse.json(
          { error: "One or more selected seats are no longer available" },
          { status: 409 }
        );
      }
      if (bookingId === -2) {
        return NextResponse.json(
          { error: "One or more seat ids are invalid for this event" },
          { status: 400 }
        );
      }

      return NextResponse.json({ bookingId, holdMinutes: HOLD_MINUTES }, { status: 201 });
    } finally {
      conn.release();
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}