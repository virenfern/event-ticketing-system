import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME;

const eventContent = [
  {
    event_id: 1,
    description:
      "An unforgettable night of music featuring top DJs and live performances across two stages, with immersive lighting and sound.",
    banner_url: "https://example.com/banners/neon-nights.jpg",
    tags: ["music", "festival", "outdoor"],
    artists: [
      {
        name: "DJ Nova",
        bio: "Bengaluru-based electronic artist known for high-energy sets.",
        photo_url: "https://example.com/artists/dj-nova.jpg",
      },
    ],
    faqs: [
      {
        question: "Is parking available?",
        answer: "Yes, on-site parking is available for all attendees.",
      },
    ],
  },
  {
    event_id: 2,
    description:
      "A full-day summit exploring breakthroughs in AI, cloud computing, and emerging tech, with hands-on workshops and keynote speakers from across the industry.",
    banner_url: "https://example.com/banners/futuretech-summit.jpg",
    tags: ["technology", "conference", "networking"],
    artists: [
      {
        name: "Dr. Anika Rao",
        bio: "AI researcher and keynote speaker on applied machine learning.",
        photo_url: "https://example.com/speakers/anika-rao.jpg",
      },
    ],
    faqs: [
      {
        question: "Will sessions be recorded?",
        answer: "Yes, all keynote sessions will be available on-demand after the event.",
      },
    ],
  },
];

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const collection = db.collection("event_content");

  // Wipe and reseed, so this script is safely re-runnable
  await collection.deleteMany({});
  await collection.insertMany(eventContent);

  // Full-text search index over description + tags (see Step 6 below)
  await collection.createIndex(
    { description: "text", tags: "text" },
    { name: "event_content_text_search" }
  );

  console.log(`Seeded ${eventContent.length} event_content documents and created text index.`);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
