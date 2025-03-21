import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "Poem ID is required." }, { status: 400 });
    }

    // Fetch poem
    const result = await sql`SELECT * FROM poems WHERE id = ${id}`;
    console.log("Fetched poem result:", result); // Debugging log

    if (!result || result.length === 0) {
      return NextResponse.json({ error: "Poem not found." }, { status: 404 });
    }

    return NextResponse.json(result[0]); // Return single poem
  } catch (error) {
    console.error("Error fetching poem:", error);
    return NextResponse.json({ error: "Failed to fetch poem." }, { status: 500 });
  }
}
