import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import admin from "@/app/lib/firebaseAdmin";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in environment variables!");
}

const sql = neon(process.env.DATABASE_URL!);

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    // Extract poem ID from route parameters
    const { id } = params;
    console.log("🔍 Deleting poem with ID:", id);

    // Get Authorization header and verify Firebase token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("❌ Missing Authorization Header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const currentUserId = decodedToken.uid;
    console.log("✅ Current User ID from Token:", currentUserId);

    // Fetch the poem to verify it exists and belongs to the current user
    const poemRecord = await sql`
      SELECT * FROM poems WHERE id = ${id}
    `;
    if (!poemRecord || poemRecord.length === 0) {
      console.error("❌ Poem not found");
      return NextResponse.json({ error: "Poem not found" }, { status: 404 });
    }
    const poem = poemRecord[0];
    if (poem.user_id !== currentUserId) {
      console.error("❌ Unauthorized: You cannot delete someone else's poem");
      return NextResponse.json({ error: "Unauthorized: Cannot delete poem" }, { status: 403 });
    }

    // Delete the poem; cascading rules in your DB should handle likes/saved deletions
    await sql`
      DELETE FROM poems WHERE id = ${id}
    `;
    console.log("✅ Poem deleted successfully");

    return NextResponse.json({ success: true, message: "Poem deleted" }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Error deleting poem:", error.message);
    return NextResponse.json({ error: "Failed to delete poem", details: error.message }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  // Extract current user's UID from the Authorization header, if provided.
  let currentUserId: string | null = null;
  const authHeader = req.headers.get("Authorization");
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      currentUserId = decodedToken.uid;
    } catch (error) {
      console.error("❌ Firebase Token Verification Failed:", error);
    }
  }

  try {
    // Query the single poem with like count and user-specific liked/saved flags.
    const poemRecords = await sql`
      SELECT 
        poems.id,
        poems.text,
        poems.author,
        poems.user_id,
        poems.created_at,
        COALESCE(lc.total_likes, 0)::int AS likes,
        CASE 
          WHEN (SELECT COUNT(*) FROM likes WHERE likes.poem_id = poems.id AND likes.user_id = ${currentUserId}) > 0
          THEN true ELSE false
        END AS liked,
        CASE 
          WHEN (SELECT COUNT(*) FROM saved WHERE saved.poem_id = poems.id AND saved.user_id = ${currentUserId}) > 0
          THEN true ELSE false
        END AS saved_by_user
      FROM poems
      LEFT JOIN (
        SELECT poem_id, COUNT(*) AS total_likes
        FROM likes
        GROUP BY poem_id
      ) AS lc ON poems.id = lc.poem_id
      WHERE poems.id = ${params.id}
      LIMIT 1
    `;

    if (!poemRecords || poemRecords.length === 0) {
      return NextResponse.json({ error: "Poem not found" }, { status: 404 });
    }
    const poem = poemRecords[0];
    return NextResponse.json(poem);
  } catch (error: any) {
    console.error("❌ Error fetching poem:", error.message);
    return NextResponse.json({ error: "Failed to fetch poem", details: error.message }, { status: 500 });
  }
}