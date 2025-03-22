import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import admin from "../../../lib/firebaseAdmin";
import { v4 as uuidv4 } from "uuid";

const sql = neon(process.env.DATABASE_URL!);

// 📌 Fetch all poems (GET /api/poems)
export async function GET() {
  try {
    const poems = await sql`SELECT * FROM poems ORDER BY created_at DESC`;

    return NextResponse.json(poems);
  } catch (error) {
    console.error("Error fetching poems:", error);
    return NextResponse.json({ error: "Failed to fetch poems" }, { status: 500 });
  }
}

// 📌 Create a new poem (POST /api/poems)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, author, user_id } = body;

    if (!text || !author || !user_id) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Verify Firebase token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    if (!decodedToken || decodedToken.uid !== user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Store the poem in the database
    const newPoem = {
      id: uuidv4(),
      text,
      author,
      user_id,
      created_at: new Date().toISOString(),
    };

    await sql`
      INSERT INTO poems (id, text, author, user_id, created_at)
      VALUES (${newPoem.id}, ${newPoem.text}, ${newPoem.author}, ${newPoem.user_id}, ${newPoem.created_at})
    `;

    return NextResponse.json(newPoem, { status: 201 });
  } catch (error) {
    console.error("Error posting poem:", error);
    return NextResponse.json({ error: "Failed to post poem" }, { status: 500 });
  }
}
