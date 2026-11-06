import { pool } from "@/lib/db";
import { getEventContentCollection } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json(
      { error: "Query parameter q is required" },
      { status: 400 }
    );
  }

  try {
    const collection = await getEventContentCollection();

    const matches = await collection
      .find(
        { $text: { $search: q } },
        { projection: { _id: 0, event_id: 1, tags: 1, score: { $meta: "textScore" } } }
      )
      .sort({ score: { $meta: "textScore" } })
      .toArray();

    if (matches.length === 0) {
      return NextResponse.json([]);
    }

    const ids = matches.map((m) => m.event_id);

    const [rows]: any = await pool.query(
      `SELECT e.event_id, e.event_name, e.event_date, e.event_time,
              e.base_price, e.status, v.name AS venue_name, v.city
       FROM events e
       JOIN venues v ON v.venue_id = e.venue_id
       WHERE e.event_id IN (?)`,
      [ids]
    );

    const byId = new Map(rows.map((r: any) => [r.event_id, r]));
    const results = matches
      .filter((m) => byId.has(m.event_id))
      .map((m) => ({
        ...(byId.get(m.event_id) as object),
        tags: m.tags,
        relevance: m.score,
      }));

    return NextResponse.json(results);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}