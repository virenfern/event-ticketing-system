import { getEventContentCollection } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const collection = await getEventContentCollection();

    const tags = await collection
      .aggregate([
        { $unwind: "$tags" },
        {
          $group: {
            _id: "$tags",
            eventCount: { $sum: 1 },
            eventIds: { $push: "$event_id" },
          },
        },
        { $sort: { eventCount: -1, _id: 1 } },
        { $project: { _id: 0, tag: "$_id", eventCount: 1, eventIds: 1 } },
      ])
      .toArray();

    return NextResponse.json(tags);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}