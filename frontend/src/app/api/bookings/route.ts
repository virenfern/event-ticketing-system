
import { randomBytes } from "crypto";
import { pool } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const HOLD_MINUTES = 10;
const MAX_SEATS_PER_BOOKING = 10;

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);

  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  if (user.role !== "attendee") {
    return NextResponse.json({ error: "Attendees only" }, { status: 403 });
  }

  try {
    const [bookings]: any = await pool.query(
      `SELECT
          b.booking_id,
          b.booking_reference,
          b.event_id,
          e.event_name,
          DATE(e.start_datetime) AS event_date,
          TIME(e.start_datetime) AS event_time,
          v.venue_name,
          v.city,
          b.status,
          b.total_amount,
          b.booking_date,
          (
            SELECT MIN(sh.expires_at)
            FROM booking_seats bs2
            JOIN seat_holds sh
              ON sh.seat_id = bs2.seat_id
             AND sh.attendee_id = b.attendee_id
             AND sh.status = 'ACTIVE'
             AND sh.expires_at > NOW()
            WHERE bs2.booking_id = b.booking_id
          ) AS expires_at
       FROM bookings b
       JOIN events e ON e.event_id = b.event_id
       JOIN venues v ON v.venue_id = e.venue_id
       WHERE b.attendee_id = ?
       ORDER BY b.booking_date DESC`,
      [user.userId]
    );

    if (bookings.length === 0) {
      return NextResponse.json([]);
    }

    const bookingIds = bookings.map((b: any) => b.booking_id);

    const [seatRows]: any = await pool.query(
      `SELECT
          bs.booking_id,
          s.seat_id,
          s.section_name AS section,
          s.row_label AS row_no,
          s.seat_number AS seat_no,
          s.seat_type,
          bs.price_at_booking
       FROM booking_seats bs
       JOIN seats s ON s.seat_id = bs.seat_id
       WHERE bs.booking_id IN (?)
       ORDER BY s.section_name, s.row_label, s.seat_number`,
      [bookingIds]
    );

    const seatsByBooking = new Map<number, any[]>();

    for (const seat of seatRows) {
      const existing = seatsByBooking.get(seat.booking_id) ?? [];
      existing.push(seat);
      seatsByBooking.set(seat.booking_id, existing);
    }

    return NextResponse.json(
      bookings.map((booking: any) => ({
        ...booking,
        seats: seatsByBooking.get(booking.booking_id) ?? [],
      }))
    );
  } catch (err: any) {
    console.error("Fetch bookings error:", err);

    return NextResponse.json(
      { error: "Unable to fetch bookings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);

  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  if (user.role !== "attendee") {
    return NextResponse.json({ error: "Attendees only" }, { status: 403 });
  }

  let conn: any;
  let attendeeId: number | null = null;
  let bookingId: number | null = null;
  const heldSeatIds: number[] = [];

  try {
    const { eventId, seatIds } = await req.json();

    if (
      !Number.isInteger(eventId) ||
      !Array.isArray(seatIds) ||
      seatIds.length === 0 ||
      seatIds.length > MAX_SEATS_PER_BOOKING ||
      !seatIds.every((id: unknown) => Number.isInteger(id)) ||
      new Set(seatIds).size !== seatIds.length
    ) {
      return NextResponse.json(
        {
          error: `Provide an eventId and 1-${MAX_SEATS_PER_BOOKING} unique integer seatIds.`,
        },
        { status: 400 }
      );
    }

    // In this database, attendee_id is also the users.user_id.
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

    attendeeId = attendeeRows[0].attendee_id;

    // Verify that all selected seats belong to the requested event.
    const [seatRows]: any = await pool.query(
      `SELECT seat_id, price, status
       FROM seats
       WHERE event_id = ?
         AND seat_id IN (?)`,
      [eventId, seatIds]
    );

    if (seatRows.length !== seatIds.length) {
      return NextResponse.json(
        { error: "One or more seat IDs are invalid for this event" },
        { status: 400 }
      );
    }

    const totalAmount = seatRows.reduce(
      (sum: number, seat: any) => sum + Number(seat.price),
      0
    );

    conn = await pool.getConnection();

    try {
      // The existing procedure handles one seat per call
      // and manages its own transaction.
      for (const seatId of seatIds) {
        await conn.query("CALL hold_seat(?, ?, ?)", [
          seatId,
          attendeeId,
          HOLD_MINUTES,
        ]);

        heldSeatIds.push(seatId);
      }

      // All seats are held. Now create one booking.
      const bookingReference =
        `VYBE-${Date.now()}-${randomBytes(5).toString("hex")}`;

      const [bookingResult]: any = await conn.query(
        `INSERT INTO bookings
          (attendee_id, event_id, booking_reference, total_amount, status)
         VALUES (?, ?, ?, ?, 'PENDING')`,
        [attendeeId, eventId, bookingReference, totalAmount]
      );

      bookingId = bookingResult.insertId;

      // Link every held seat to this booking.
      for (const seat of seatRows) {
        await conn.query(
          `INSERT INTO booking_seats
            (booking_id, seat_id, price_at_booking)
           VALUES (?, ?, ?)`,
          [bookingId, seat.seat_id, seat.price]
        );
      }

      return NextResponse.json(
        {
          message: "Seats held successfully",
          bookingId,
          bookingReference,
          totalAmount,
          holdMinutes: HOLD_MINUTES,
        },
        { status: 201 }
      );
    } catch (err: any) {
      // Compensate if any seat hold or booking operation fails.
      if (heldSeatIds.length > 0) {
        try {
          await conn.query(
            `UPDATE seat_holds
             SET status = 'RELEASED'
             WHERE attendee_id = ?
               AND seat_id IN (?)
               AND status = 'ACTIVE'`,
            [attendeeId, heldSeatIds]
          );

          await conn.query(
            `UPDATE seats
             SET status = 'AVAILABLE'
             WHERE seat_id IN (?)
               AND status = 'HELD'
               AND NOT EXISTS (
                 SELECT 1
                 FROM seat_holds sh
                 WHERE sh.seat_id = seats.seat_id
                   AND sh.status = 'ACTIVE'
                   AND sh.expires_at > NOW()
               )`,
            [heldSeatIds]
          );
        } catch (cleanupError) {
          console.error("Seat hold cleanup error:", cleanupError);
        }
      }

      if (bookingId !== null) {
        try {
          await conn.query(
            `UPDATE bookings
             SET status = 'EXPIRED'
             WHERE booking_id = ?`,
            [bookingId]
          );
        } catch (bookingCleanupError) {
          console.error("Booking cleanup error:", bookingCleanupError);
        }
      }

      throw err;
    } finally {
      conn.release();
    }
  } catch (err: any) {
    console.error("Create booking error:", err);

    const message = String(err.message || "");

    if (message.includes("Seat is not available")) {
      return NextResponse.json(
        { error: "One or more selected seats are no longer available." },
        { status: 409 }
      );
    }

    if (
      message.includes("Seat does not exist") ||
      message.includes("Attendee does not exist")
    ) {
      return NextResponse.json(
        { error: message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Unable to create booking. Please try again." },
      { status: 500 }
    );
  }
}
