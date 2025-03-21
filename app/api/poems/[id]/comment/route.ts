import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!); // Initialize Neon with env variable

export async function POST(
  req: Request,
  { params }: { params: { id: string } } // Type safety for params
) {
  try {
    const { id } = params; // Extract poem ID
    const { text } = await req.json(); // Extract comment text

    if (!text) {
      return NextResponse.json({ error: "Comment text is required." }, { status: 400 });
    }

    // Insert comment into database
    await sql`INSERT INTO comments (poem_id, text) VALUES (${id}, ${text})`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding comment:", error);
    return NextResponse.json({ error: "Failed to add comment." }, { status: 500 });
  }
}
