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

    // Insert saved poem (avoiding duplicates)
    await sql`INSERT INTO saved_poems (poem_id) VALUES (${id}) 
              ON CONFLICT (poem_id) DO NOTHING`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving poem:", error);
    return NextResponse.json({ error: "Failed to save poem." }, { status: 500 });
  }
}
