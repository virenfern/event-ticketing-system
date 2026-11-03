import { pool } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, email, password, role, orgName, phone } = await req.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "name, email, password, and role are required" },
        { status: 400 }
      );
    }
    if (!["attendee", "organizer", "admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [userResult]: any = await conn.query(
        "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
        [name, email, passwordHash, role]
      );
      const userId = userResult.insertId;

      if (role === "organizer") {
        await conn.query(
          "INSERT INTO organizers (user_id, org_name, phone) VALUES (?, ?, ?)",
          [userId, orgName ?? name, phone ?? null]
        );
      } else if (role === "attendee") {
        await conn.query(
          "INSERT INTO attendees (user_id, phone) VALUES (?, ?)",
          [userId, phone ?? null]
        );
      } else if (role === "admin") {
        await conn.query("INSERT INTO admins (user_id) VALUES (?)", [userId]);
      }

      await conn.commit();
      return NextResponse.json({ userId, role }, { status: 201 });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err: any) {
    if (err.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}