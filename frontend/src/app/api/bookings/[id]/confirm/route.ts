import { pool } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const PAYMENT_METHODS = ["upi", "card", "netbanking"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bookingId = Number(id);

  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  if (user.role !== "attendee") {
    return NextResponse.json({ error: "Attendees only" }, { status: 403 });
  }

  try {
    const { paymentMethod } = await req.json();

    if (!Number.isInteger(bookingId) || !PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json(
        { error: `paymentMethod must be one of: ${PAYMENT_METHODS.join(", ")}` },
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
      await conn.query("CALL confirm_booking(?, ?, ?, @result)", [
        bookingId,
        attendeeRows[0].attendee_id,
        paymentMethod,
      ]);
      const [[row]]: any = await conn.query("SELECT @result AS result");

      if (row.result === "not_found") {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }
      if (row.result === "not_held") {
        return NextResponse.json(
          { error: "Booking is no longer held (expired, cancelled or already confirmed)" },
          { status: 409 }
        );
      }

      return NextResponse.json({ message: "Booking confirmed", bookingId });
    } finally {
      conn.release();
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}