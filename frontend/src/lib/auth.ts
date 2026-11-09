import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

export function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
      role: string;
      email: string;
    };
  } catch {
    return null;
  }
}