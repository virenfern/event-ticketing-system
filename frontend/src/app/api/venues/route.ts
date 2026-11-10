
import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [rows] = await pool.query(
      `SELECT
          venue_id,
          venue_name,
          address,
          city,
          capacity
       FROM venues
       ORDER BY city, venue_name`
    );

    return NextResponse.json(rows);
  } catch (err: any) {
    console.error("GET /api/venues error:", err.message);

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
