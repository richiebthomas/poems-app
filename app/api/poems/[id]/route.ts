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
