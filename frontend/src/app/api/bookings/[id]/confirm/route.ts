import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json();
    const { amount, paymentMethod } = body;

    if (!amount || !paymentMethod) {
      return NextResponse.json(
        { error: "amount and paymentMethod are required" },
        { status: 400 }
      );
    }

    await pool.query("CALL confirm_booking(?, ?, ?)", [id, amount, paymentMethod]);

    return NextResponse.json({ message: "Booking confirmed", bookingId: Number(id) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}