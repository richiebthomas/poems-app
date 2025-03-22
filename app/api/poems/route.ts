import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    const poems = await sql`
      SELECT poems.*, 
        COALESCE((SELECT COUNT(*) FROM likes WHERE likes.poem_id = poems.id), 0)::int AS likes,
        COALESCE((SELECT COUNT(*) FROM saved WHERE saved.poem_id = poems.id), 0)::int AS saved
      FROM poems
      ORDER BY created_at DESC;
    `;

    console.log("📜 Poems with Like & Save Counts:", poems);

    if (!Array.isArray(poems)) {
      console.error("❌ Database did not return an array:", poems);
      return NextResponse.json([], { status: 500 });
    }

    return NextResponse.json(poems);
  } catch (error) {
    console.error("❌ Error fetching poems:", error);
    return NextResponse.json([], { status: 500 });
  }
}
