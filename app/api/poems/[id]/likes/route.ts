import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!); // Initialize Neon with env variable

export async function POST(
  req: Request,
  { params }: { params: { id: string } } // Type safety for params
) {
  try {
    const { id } = params; // Extract poem ID

    if (!id) {
      return NextResponse.json({ error: "Poem ID is required." }, { status: 400 });
    }

    // Update likes count in database
    await sql`UPDATE poems SET likes = likes + 1 WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error liking poem:", error);
    return NextResponse.json({ error: "Failed to like poem." }, { status: 500 });
  }
}
