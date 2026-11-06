import { pool } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { getEventContentCollection } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  if (user.role !== "organizer") {
    return NextResponse.json({ error: "Organizers only" }, { status: 403 });
  }

  try {
    // Ownership check lives in MySQL, since that's where events and organizers are
    const [owned]: any = await pool.query(
      `SELECT e.event_id FROM events e
       JOIN organizers o ON o.organizer_id = e.organizer_id
       WHERE e.event_id = ? AND o.user_id = ?`,
      [id, user.userId]
    );
    if (owned.length === 0) {
      return NextResponse.json(
        { error: "You do not own this event" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const updates: Record<string, unknown> = {};
    if (typeof body.description === "string") updates.description = body.description;
    if (typeof body.bannerUrl === "string") updates.banner_url = body.bannerUrl;
    if (Array.isArray(body.tags)) updates.tags = body.tags;
    if (Array.isArray(body.artists)) updates.artists = body.artists;
    if (Array.isArray(body.faqs)) updates.faqs = body.faqs;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const collection = await getEventContentCollection();
    await collection.updateOne(
      { event_id: Number(id) },
      { $set: updates },
      { upsert: true }
    );

    return NextResponse.json({ message: "Content updated", eventId: Number(id) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}