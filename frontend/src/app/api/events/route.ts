
import { pool } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { getEventContentCollection } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const [rows] = await pool.query(
      `SELECT
          e.event_id,
          e.event_name,
          DATE(e.start_datetime) AS event_date,
          TIME(e.start_datetime) AS event_time,
          e.base_price,
          e.status,
          v.venue_name AS venue_name,
          v.city
       FROM events e
       JOIN venues v ON v.venue_id = e.venue_id
       ORDER BY e.start_datetime`
    );

    return NextResponse.json(rows);
  } catch (err: any) {
    console.error("GET /api/events error:", err.message);

    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);

  if (!user) {
    return NextResponse.json(
      { error: "Not logged in" },
      { status: 401 }
    );
  }

  if (user.role !== "organizer") {
    return NextResponse.json(
      { error: "Organizers only" },
      { status: 403 }
    );
  }

  try {
    const {
      venueId,
      eventName,
      category,
      description,
      eventDate,
      eventTime,
      endTime,
      basePrice,
      seatLayout,
      content,
    } = await req.json();

    // Validate required fields.
    if (
      !venueId ||
      !eventName?.trim() ||
      !category?.trim() ||
      !eventDate ||
      !eventTime ||
      !endTime ||
      basePrice === undefined
    ) {
      return NextResponse.json(
        {
          error:
            "venueId, eventName, category, eventDate, eventTime, endTime and basePrice are required",
        },
        { status: 400 }
      );
    }

    // Validate date, time and price.
    if (
      isNaN(Date.parse(eventDate)) ||
      !/^\d{2}:\d{2}(:\d{2})?$/.test(eventTime) ||
      !/^\d{2}:\d{2}(:\d{2})?$/.test(endTime) ||
      !Number.isFinite(Number(basePrice)) ||
      Number(basePrice) < 0
    ) {
      return NextResponse.json(
        { error: "Invalid event date, time or base price" },
        { status: 400 }
      );
    }

    const normalizeTime = (time: string) =>
      time.length === 5 ? `${time}:00` : time;

    const normalizedStartTime = normalizeTime(eventTime);
    const normalizedEndTime = normalizeTime(endTime);

    if (normalizedEndTime <= normalizedStartTime) {
      return NextResponse.json(
        { error: "End time must be later than start time" },
        { status: 400 }
      );
    }

    if (
      seatLayout !== undefined &&
      !Array.isArray(seatLayout)
    ) {
      return NextResponse.json(
        { error: "seatLayout must be an array" },
        { status: 400 }
      );
    }

    const startDateTime =
      `${eventDate} ${normalizedStartTime}`;

    const endDateTime =
      `${eventDate} ${normalizedEndTime}`;

    // Prepare seat records.
    const seatRows: any[] = [];

    if (Array.isArray(seatLayout)) {
      for (const block of seatLayout) {
        if (
          !block.section ||
          !Number.isInteger(Number(block.rows)) ||
          !Number.isInteger(Number(block.seatsPerRow)) ||
          Number(block.rows) <= 0 ||
          Number(block.seatsPerRow) <= 0
        ) {
          return NextResponse.json(
            {
              error:
                "Each seat layout block needs a section, positive rows and positive seats per row",
            },
            { status: 400 }
          );
        }

        const seatTypeMap: Record<string, string> = {
          standard: "REGULAR",
          regular: "REGULAR",
          premium: "PREMIUM",
          vip: "VIP",
        };

        const requestedType = String(
          block.seatType ?? "standard"
        ).toLowerCase();

        const seatType = seatTypeMap[requestedType];

        if (!seatType) {
          return NextResponse.json(
            { error: `Invalid seat type: ${block.seatType}` },
            { status: 400 }
          );
        }

        const seatPrice = Number(block.price ?? basePrice);

        if (
          !Number.isFinite(seatPrice) ||
          seatPrice < 0
        ) {
          return NextResponse.json(
            { error: "Invalid seat price" },
            { status: 400 }
          );
        }

        for (
          let r = 1;
          r <= Number(block.rows);
          r++
        ) {
          for (
            let s = 1;
            s <= Number(block.seatsPerRow);
            s++
          ) {
            seatRows.push([
              block.section,
              String(r),
              String(s),
              seatType,
              seatPrice,
            ]);
          }
        }
      }
    }

    if (seatRows.length > 2000) {
      return NextResponse.json(
        { error: "Too many seats (maximum 2000)" },
        { status: 400 }
      );
    }

    const conn = await pool.getConnection();

    let eventId: number;

    try {
      await conn.beginTransaction();

      // Find the organizer profile.
      // In this database, organizer_id is the user's ID.
      const [orgRows]: any = await conn.query(
        `SELECT organizer_id
         FROM organizers
         WHERE organizer_id = ?`,
        [user.userId]
      );

      if (orgRows.length === 0) {
        await conn.rollback();

        return NextResponse.json(
          { error: "Organizer profile not found" },
          { status: 403 }
        );
      }

      // Check that the venue exists and has sufficient capacity.
      const [venueRows]: any = await conn.query(
        `SELECT capacity
         FROM venues
         WHERE venue_id = ?`,
        [venueId]
      );

      if (venueRows.length === 0) {
        await conn.rollback();

        return NextResponse.json(
          { error: "Selected venue does not exist" },
          { status: 400 }
        );
      }

      if (seatRows.length > Number(venueRows[0].capacity)) {
        await conn.rollback();

        return NextResponse.json(
          {
            error:
              `Generated seat count (${seatRows.length}) exceeds venue capacity (${venueRows[0].capacity})`,
          },
          { status: 400 }
        );
      }

      // Insert event into MySQL.
      const [result]: any = await conn.query(
        `INSERT INTO events
          (
            organizer_id,
            venue_id,
            event_name,
            category,
            description,
            start_datetime,
            end_datetime,
            base_price,
            status
          )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED')`,
        [
          orgRows[0].organizer_id,
          venueId,
          eventName.trim(),
          category.trim(),
          description ?? "",
          startDateTime,
          endDateTime,
          Number(basePrice),
        ]
      );

      eventId = result.insertId;

      // Insert generated seats into MySQL.
      if (seatRows.length > 0) {
        const withEventId = seatRows.map((row) => [
          eventId,
          ...row,
        ]);

        await conn.query(
          `INSERT INTO seats
            (
              event_id,
              section_name,
              row_label,
              seat_number,
              seat_type,
              price
            )
           VALUES ?`,
          [withEventId]
        );
      }

      await conn.commit();
    } catch (err: any) {
      await conn.rollback();

      if (
        err.code === "ER_NO_REFERENCED_ROW_2" ||
        err.code === "ER_NO_REFERENCED_ROW"
      ) {
        return NextResponse.json(
          { error: "Venue or organizer does not exist" },
          { status: 400 }
        );
      }

      console.error(
        "POST /api/events database error:",
        err.message
      );

      return NextResponse.json(
        { error: "Failed to create event in database" },
        { status: 500 }
      );
    } finally {
      conn.release();
    }

    // Save additional event content in MongoDB.
    try {
      const collection = await getEventContentCollection();

      await collection.insertOne({
        event_id: eventId,
        description: content?.description ?? description ?? "",
        banner_url: content?.bannerUrl ?? "",
        tags: Array.isArray(content?.tags)
          ? content.tags
          : [],
        artists: Array.isArray(content?.artists)
          ? content.artists
          : [],
        faqs: Array.isArray(content?.faqs)
          ? content.faqs
          : [],
      });
    } catch (err: any) {
      console.error(
        "MongoDB event content error:",
        err.message
      );

      // Clean up the event and its seats if MongoDB insertion fails.
      const cleanupConn = await pool.getConnection();

      try {
        await cleanupConn.beginTransaction();

        await cleanupConn.query(
          "DELETE FROM seats WHERE event_id = ?",
          [eventId]
        );

        await cleanupConn.query(
          "DELETE FROM events WHERE event_id = ?",
          [eventId]
        );

        await cleanupConn.commit();
      } catch (cleanupError) {
        await cleanupConn.rollback();
        console.error("Event cleanup error:", cleanupError);
      } finally {
        cleanupConn.release();
      }

      return NextResponse.json(
        {
          error:
            "Failed to save event content. Event creation was rolled back.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Event created successfully",
        eventId,
        seatsCreated: seatRows.length,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error(
      "POST /api/events error:",
      err.message
    );

    return NextResponse.json(
      { error: err.message || "Invalid request" },
      { status: 500 }
    );
  }
}
