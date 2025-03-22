import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import admin from "../../../../lib/firebaseAdmin";

const sql = neon(process.env.DATABASE_URL!);

// Save a poem
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { user_id } = body;

    console.log("📩 Request Body:", body);
    console.log("📜 Poem ID:", id);
    console.log("✅ User ID:", user_id);

    if (!user_id) {
      console.error("❌ Missing user_id");
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

    // Verify Firebase token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    if (!decodedToken || decodedToken.uid !== user_id) {
      console.error("🚨 Unauthorized User");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if already saved
    const existingSave = await sql`
      SELECT * FROM saved WHERE poem_id = ${id} AND user_uid = ${user_id}
    `;

    if (existingSave.length > 0) {
      console.warn("⚠️ Poem already saved");
      return NextResponse.json({ error: "You have already saved this poem" }, { status: 400 });
    }

    // Save poem
    await sql`
      INSERT INTO saved (poem_id, user_uid) VALUES (${id}, ${user_id})
    `;

    console.log("✅ Poem saved successfully!");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Error saving poem:", error);
    return NextResponse.json({ error: "Failed to save poem" }, { status: 500 });
  }
}
