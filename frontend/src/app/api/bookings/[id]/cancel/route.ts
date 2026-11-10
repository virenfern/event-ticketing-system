
import { pool } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bookingId = Number(id);

  const user = getUserFromRequest(req);

  if (!user) {
    return NextResponse.json(
      { error: "Not logged in" },
      { status: 401 }
    );
  }

  if (user.role !== "attendee") {
    return NextResponse.json(
      { error: "Attendees only" },
      { status: 403 }
    );
  }

  if (!Number.isInteger(bookingId) || bookingId <= 0) {
    return NextResponse.json(
      { error: "Invalid booking ID" },
      { status: 400 }
    );
  }

  let conn: any;

  try {
    const [attendeeRows]: any = await pool.query(
      "SELECT attendee_id FROM attendees WHERE attendee_id = ?",
      [user.userId]
    );

    if (attendeeRows.length === 0) {
      return NextResponse.json(
        { error: "Attendee profile not found" },
        { status: 403 }
      );
    }

    const attendeeId = attendeeRows[0].attendee_id;

    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Lock the booking and verify ownership.
    const [bookingRows]: any = await conn.query(
      `SELECT booking_id, status
       FROM bookings
       WHERE booking_id = ? AND attendee_id = ?
       FOR UPDATE`,
      [bookingId, attendeeId]
    );

    if (bookingRows.length === 0) {
      await conn.rollback();

      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    if (bookingRows[0].status !== "PENDING") {
      await conn.rollback();

      return NextResponse.json(
        { error: "Only pending bookings can be cancelled" },
        { status: 409 }
      );
    }

    // Find the seats associated with this booking.
    const [seatRows]: any = await conn.query(
      "SELECT seat_id FROM booking_seats WHERE booking_id = ?",
      [bookingId]
    );

    const seatIds = seatRows.map((row: any) => row.seat_id);

    if (seatIds.length > 0) {
      const placeholders = seatIds.map(() => "?").join(", ");

      // Lock the relevant seat records.
      await conn.query(
        `SELECT seat_id FROM seats
         WHERE seat_id IN (${placeholders})
         FOR UPDATE`,
        seatIds
      );

      // Release this attendee's active holds.
      await conn.query(
        `UPDATE seat_holds
         SET status = 'RELEASED'
         WHERE attendee_id = ?
           AND seat_id IN (${placeholders})
           AND status = 'ACTIVE'`,
        [attendeeId, ...seatIds]
      );

      // Make held seats available, but never free booked seats.
      await conn.query(
        `UPDATE seats s
         SET s.status = 'AVAILABLE'
         WHERE s.seat_id IN (${placeholders})
           AND s.status = 'HELD'
           AND NOT EXISTS (
             SELECT 1
             FROM seat_holds sh
             WHERE sh.seat_id = s.seat_id
               AND sh.status = 'ACTIVE'
               AND sh.expires_at > NOW()
           )`,
        seatIds
      );
    }

    // Mark the booking as cancelled.
    await conn.query(
      `UPDATE bookings
       SET status = 'CANCELLED'
       WHERE booking_id = ? AND attendee_id = ?`,
      [bookingId, attendeeId]
    );

    await conn.commit();

    return NextResponse.json({
      message: "Booking cancelled successfully",
      bookingId
    });

  } catch (err: any) {
    if (conn) {
      await conn.rollback();
    }

    console.error("Booking cancellation error:", err);

    return NextResponse.json(
      { error: "Unable to cancel booking" },
      { status: 500 }
    );

  } finally {
    if (conn) {
      conn.release();
    }
  }
}
