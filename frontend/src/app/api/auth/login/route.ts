import { pool } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Match the actual MySQL users table
    const [rows]: any = await pool.query(
      `SELECT
         user_id,
         full_name AS name,
         email,
         password_hash,
         role,
         account_status
       FROM users
       WHERE email = ?`,
      [email]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const user = rows[0];

    // Check account status (database enum uses uppercase values)
    if (user.account_status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Your account is not active. Please contact support." },
        { status: 403 }
      );
    }

    // Verify password
    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    // Normalize role to lowercase for API authorization checks
    const role = String(user.role).toLowerCase();

    const token = jwt.sign(
      {
        userId: user.user_id,
        role,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const response = NextResponse.json({
      userId: user.user_id,
      name: user.name,
      role,
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Login error:", err);

    return NextResponse.json(
      { error: "Something went wrong during login" },
      { status: 500 }
    );
  }
}