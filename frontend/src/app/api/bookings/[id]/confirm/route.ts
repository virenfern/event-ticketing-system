
import { randomUUID } from "crypto";
import { pool } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const PAYMENT_METHODS = ["UPI", "CARD", "NET_BANKING", "WALLET"];

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

  try {
    const { paymentMethod } = await req.json();

    const normalizedMethod = String(paymentMethod ?? "").toUpperCase();

    if (!PAYMENT_METHODS.includes(normalizedMethod)) {
      return NextResponse.json(
        {
          error: `paymentMethod must be one of: ${PAYMENT_METHODS.join(", ")}`
        },
        { status: 400 }
      );
    }

    // In the existing schema, attendee_id is also the users.user_id.
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

    const conn = await pool.getConnection();

    try {
      const [referenceRows]: any = await conn.query(
        "SELECT status FROM bookings WHERE booking_id = ? AND attendee_id = ?",
        [bookingId, attendeeRows[0].attendee_id]
      );

      if (referenceRows.length === 0) {
        return NextResponse.json(
          { error: "Booking not found" },
          { status: 404 }
        );
      }

      await conn.query(
        "CALL confirm_booking(?, ?, ?, @result)",
        [
          bookingId,
          attendeeRows[0].attendee_id,
          normalizedMethod
        ]
      );

      const [[row]]: any = await conn.query(
        "SELECT @result AS result"
      );

      if (row.result === "not_found") {
        return NextResponse.json(
          { error: "Booking not found" },
          { status: 404 }
        );
      }

      if (row.result === "not_held") {
        return NextResponse.json(
          {
            error: "Booking is no longer held. It may have expired, been cancelled, or already been confirmed."
          },
          { status: 409 }
        );
      }

      if (row.result !== "confirmed") {
        return NextResponse.json(
          { error: "Unable to confirm booking" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: "Booking confirmed successfully",
        bookingId,
        paymentMethod: normalizedMethod,
        paymentStatus: "SUCCESS"
      });

    } finally {
      conn.release();
    }

  } catch (err: any) {
    console.error("Booking confirmation error:", err);

    return NextResponse.json(
      { error: "Unable to confirm booking" },
      { status: 500 }
    );
  }
}
