import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import admin from "../../../../lib/firebaseAdmin"; // Firebase Admin SDK

const sql = neon(process.env.DATABASE_URL!);

export async function GET(req: Request, context: { params: { user_id: string } }) {
  try {
    const { user_id } = await context.params; // ✅ Await `params`

    console.log(`🔍 Fetching saved poems for user: ${user_id}`);

    if (!user_id) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

    // 🔐 Verify Firebase Token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("🚨 Missing Authorization Header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      console.log("✅ Firebase Token Verified:", decodedToken.uid);
      if (decodedToken.uid !== user_id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } catch (error) {
      console.error("🚨 Firebase Token Verification Failed:", error);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 📝 Fetch saved poems for the user (using `saved` table and `user_uid`)
    const savedPoems = await sql`
      SELECT poems.* FROM saved
      JOIN poems ON saved.poem_id = poems.id
      WHERE saved.user_uid = ${user_id}
    `;

    console.log(`✅ Saved Poems Found:`, savedPoems);

    return NextResponse.json(savedPoems);
  } catch (error) {
    console.error("❌ Error fetching saved poems:", error);
    return NextResponse.json({ error: "Failed to fetch saved poems" }, { status: 500 });
  }
}
