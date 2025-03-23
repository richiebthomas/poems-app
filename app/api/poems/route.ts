import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import admin from "@/app/lib/firebaseAdmin"; // Adjust the path if necessary
import { v4 as uuidv4 } from "uuid";

if (!process.env.DATABASE_URL) {
  throw new Error("❌ DATABASE_URL is not defined in environment variables!");
}

const sql = neon(process.env.DATABASE_URL!);

//
// GET: Fetch all poems with like and save counts and with liked/saved_by_user flags.
//
export async function GET(req: Request) {
  // Try to get the current user's UID from the Authorization header (if provided)
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
    // Query poems with total likes and flag if the current user liked or saved them
    const poems = await sql`
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
      ORDER BY poems.created_at DESC
    `;

    const result = Array.isArray(poems) ? poems : [];
    console.log("📜 Fetched Poems with Counts:", result);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("❌ Error fetching poems:", error.message);
    return NextResponse.json({ error: "Failed to fetch poems", details: error.message }, { status: 500 });
  }
}

//
// POST: Create a new poem
//
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("📥 Incoming Request Body:", body);

    const { text, author, user_id } = body;
    if (!text || !author || !user_id) {
      console.error("❌ Missing fields:", { text, author, user_id });
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Verify Firebase token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("❌ Missing Authorization Header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (error: any) {
      console.error("❌ Firebase Token Verification Failed:", error.message);
      return NextResponse.json({ error: "Unauthorized", details: error.message }, { status: 401 });
    }
    if (!decodedToken || decodedToken.uid !== user_id) {
      console.error("❌ Unauthorized: Token UID does not match user_id");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const newPoem = {
      id: uuidv4(),
      text,
      author,
      user_id,
      created_at: new Date().toISOString(),
    };

    console.log("📝 Inserting Poem:", newPoem);

    await sql`
      INSERT INTO poems (id, text, author, user_id, created_at)
      VALUES (${newPoem.id}, ${newPoem.text}, ${newPoem.author}, ${newPoem.user_id}, ${newPoem.created_at})
    `;

    return NextResponse.json(newPoem, { status: 201 });
  } catch (error: any) {
    console.error("❌ Error posting poem:", error.message);
    return NextResponse.json({ error: "Failed to post poem", details: error.message }, { status: 500 });
  }
}

//
// DELETE: Delete a poem (only if it belongs to the current user)
//
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const currentUserId = decodedToken.uid;

    // Fetch the poem to verify ownership
    const poemRecord = await sql`
      SELECT * FROM poems WHERE id = ${id}
    `;
    if (!poemRecord || poemRecord.length === 0) {
      return NextResponse.json({ error: "Poem not found" }, { status: 404 });
    }
    const poem = poemRecord[0];
    if (poem.user_id !== currentUserId) {
      return NextResponse.json({ error: "Unauthorized: You cannot delete someone else's poem" }, { status: 403 });
    }

    // Delete the poem (this should cascade delete likes and saved entries if foreign keys are set)
    await sql`
      DELETE FROM poems WHERE id = ${id}
    `;
    return NextResponse.json({ success: true, message: "Poem deleted" }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Error deleting poem:", error.message);
    return NextResponse.json({ error: "Failed to delete poem", details: error.message }, { status: 500 });
  }
}
