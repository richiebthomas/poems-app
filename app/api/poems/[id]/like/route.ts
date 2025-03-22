import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import admin from "../../../../lib/firebaseAdmin";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    console.log("📩 Received Like Request");

    // Get poem ID from params
    const { id } = params;
    console.log("🔍 Poem ID:", id);

    // Parse request body
    const body = await req.json();
    console.log("📥 Request Body:", body);

    const { user_id } = body;
    if (!user_id) {
      console.log("❌ Missing user_id in request body");
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }
    console.log("✅ User ID:", user_id);

    // Verify Firebase token
    const authHeader = req.headers.get("Authorization");
    console.log("🔍 Auth Header:", authHeader);

    if (!authHeader) {
      console.log("❌ Missing Authorization Header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    console.log("🔑 Extracted Token:", token);

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      console.log("✅ Decoded Token:", decodedToken);

      if (!decodedToken || decodedToken.uid !== user_id) {
        console.log("❌ Token UID Mismatch", { decodedUID: decodedToken.uid, providedUID: user_id });
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } catch (error) {
      console.error("🚨 Firebase Token Verification Failed:", error);
      return NextResponse.json({ error: "Invalid Firebase token" }, { status: 401 });
    }

    // Check if the user has already liked this poem
    console.log("🔍 Checking if user already liked the poem...");
    const existingLike = await sql`
      SELECT * FROM likes WHERE poem_id = ${id} AND user_uid = ${user_id}
    `;
    console.log("🔎 Existing Like Query Result:", existingLike);

    if (Array.isArray(existingLike) && existingLike.length > 0) {
      console.log("⚠️ User already liked this poem.");
      return NextResponse.json({ error: "You have already liked this poem" }, { status: 400 });
    }

    // Add like to the database
    console.log("👍 Adding like to the database...");
    await sql`
      INSERT INTO likes (poem_id, user_uid) VALUES (${id}, ${user_id})
    `;
    console.log("✅ Like added successfully!");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("🚨 Error liking poem:", error);
    return NextResponse.json({ error: "Failed to like poem" }, { status: 500 });
  }
}
