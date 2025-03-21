import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

const sql = neon(process.env.DATABASE_URL!);

// Fetch all poems (GET)
export async function GET() {
  try {
    const poems = await sql`SELECT * FROM poems ORDER BY created_at DESC`;

    // Ensure it's always an array
    if (!Array.isArray(poems)) {
      console.error("API returned non-array data:", poems);
      return NextResponse.json([], { status: 500 });
    }

    return NextResponse.json(poems);
  } catch (error) {
    console.error("Error fetching poems:", error);
    return NextResponse.json({ error: "Failed to fetch poems" }, { status: 500 });
  }
}

// Create a new poem (POST)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, author } = body;

    if (!text || !author) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const newPoem = {
      id: uuidv4(),
      text,
      background: null,
      music: null,
      author,
      created_at: new Date().toISOString(),
    };

    await sql`
      INSERT INTO poems (id, text, background, music, author, created_at)
      VALUES (${newPoem.id}, ${newPoem.text}, ${newPoem.background}, ${newPoem.music}, ${newPoem.author}, ${newPoem.created_at})
    `;

    return NextResponse.json(newPoem, { status: 201 });
  } catch (error) {
    console.error("Error posting poem:", error);
    return NextResponse.json({ error: "Failed to post poem" }, { status: 500 });
  }
}
