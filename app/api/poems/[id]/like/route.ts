import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import admin from "@/app/lib/firebaseAdmin";
const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { user_id } = body;
    if (!user_id) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const token = authHeader.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    if (!decodedToken || decodedToken.uid !== user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Check if the user has already liked the poem
    const existingLike = await sql`
      SELECT * FROM likes WHERE poem_id = ${id} AND user_id = ${user_id}
    `;
    if (existingLike.length > 0) {
      return NextResponse.json({ error: "You have already liked this poem" }, { status: 400 });
    }
    // Insert a new like
    await sql`
      INSERT INTO likes (poem_id, user_id) VALUES (${id}, ${user_id})
    `;
    return NextResponse.json({ success: true, message: "Poem liked" }, { status: 201 });
  } catch (error: any) {
    console.error("❌ Error liking poem:", error.message);
    return NextResponse.json({ error: "Failed to like poem", details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { user_id } = body;
    if (!user_id) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const token = authHeader.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    if (!decodedToken || decodedToken.uid !== user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Remove the like
    await sql`
      DELETE FROM likes WHERE poem_id = ${id} AND user_id = ${user_id}
    `;
    return NextResponse.json({ success: true, message: "Poem unliked" }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Error unliking poem:", error.message);
    return NextResponse.json({ error: "Failed to unlike poem", details: error.message }, { status: 500 });
  }
}
