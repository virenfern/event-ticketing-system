
import { pool } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  let conn: any;

  try {
    const { name, email, password, role, orgName } = await req.json();

    // Validate required fields
    if (!name?.trim() || !email?.trim() || !password || !role) {
      return NextResponse.json(
        { error: "Name, email, password, and role are required" },
        { status: 400 }
      );
    }

    // Only attendees and organizers can register themselves
    const normalizedRole = String(role).toLowerCase();

    if (!["attendee", "organizer"].includes(normalizedRole)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must contain at least 8 characters" },
        { status: 400 }
      );
    }

    if (
      normalizedRole === "organizer" &&
      !orgName?.trim()
    ) {
      return NextResponse.json(
        { error: "Organization name is required for organizers" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // Insert user using the actual database column names
      const [userResult]: any = await conn.query(
        `INSERT INTO users
          (full_name, email, password_hash, role, account_status)
         VALUES (?, ?, ?, ?, 'ACTIVE')`,
        [
          name.trim(),
          email.trim().toLowerCase(),
          passwordHash,
          normalizedRole.toUpperCase(),
        ]
      );

      const userId = userResult.insertId;

      // Create the corresponding role-specific record
      if (normalizedRole === "organizer") {
        await conn.query(
          `INSERT INTO organizers
            (organizer_id, organization_name)
           VALUES (?, ?)`,
          [userId, orgName.trim()]
        );
      } else {
        await conn.query(
          `INSERT INTO attendees (attendee_id)
           VALUES (?)`,
          [userId]
        );
      }

      await conn.commit();

      return NextResponse.json(
        {
          message: "Account created successfully",
          userId,
          role: normalizedRole,
        },
        { status: 201 }
      );
    } catch (err) {
      await conn.rollback();
      throw err;
    }
  } catch (err: any) {
    console.error("Signup error:", err);

    if (err.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Unable to create account. Please try again." },
      { status: 500 }
    );
  } finally {
    if (conn) {
      conn.release();
    }
  }
}
