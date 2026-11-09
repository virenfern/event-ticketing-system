import { pool } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const tokenUser = getUserFromRequest(req);
  if (!tokenUser) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  try {
    const [rows]: any = await pool.query(
      "SELECT user_id, name, email, role, status FROM users WHERE user_id = ?",
      [tokenUser.userId]
    );

    if (rows.length === 0 || rows[0].status !== "active") {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const u = rows[0];
    return NextResponse.json({
      userId: u.user_id,
      name: u.name,
      email: u.email,
      role: u.role,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}