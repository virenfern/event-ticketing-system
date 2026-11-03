import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { attendeeId, eventId, seatIds, holdMinutes } = body;

    if (!attendeeId || !eventId || !Array.isArray(seatIds) || seatIds.length === 0) {
      return NextResponse.json(
        { error: "attendeeId, eventId, and a non-empty seatIds array are required" },
        { status: 400 }
      );
    }

    const conn = await pool.getConnection();
    try {
      await conn.query(
        "CALL hold_seats(?, ?, ?, ?, @booking_id)",
        [attendeeId, eventId, seatIds.join(","), holdMinutes ?? 10]
      );
      const [[result]]: any = await conn.query("SELECT @booking_id AS booking_id");
      const bookingId = result.booking_id;

      if (bookingId === -1) {
        return NextResponse.json(
          { error: "One or more selected seats are no longer available" },
          { status: 409 }
        );
      }

      return NextResponse.json({ bookingId }, { status: 201 });
    } finally {
      conn.release();
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}