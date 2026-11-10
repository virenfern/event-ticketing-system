
import { pool } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const tokenUser = getUserFromRequest(req);

  if (!tokenUser) {
    return NextResponse.json(
      { error: "Not logged in" },
      { status: 401 }
    );
  }

  try {
    const [rows]: any = await pool.query(
      `SELECT
          user_id,
          full_name AS name,
          email,
          role,
          account_status
       FROM users
       WHERE user_id = ?`,
      [tokenUser.userId]
    );

    if (
      rows.length === 0 ||
      rows[0].account_status !== "ACTIVE"
    ) {
      return NextResponse.json(
        { error: "Not logged in" },
        { status: 401 }
      );
    }

    const u = rows[0];

    return NextResponse.json({
      userId: u.user_id,
      name: u.name,
      email: u.email,
      role: String(u.role).toLowerCase(),
    });
  } catch (err: any) {
    console.error("Auth me error:", err);

    return NextResponse.json(
      { error: "Unable to retrieve user information" },
      { status: 500 }
    );
  }
}
