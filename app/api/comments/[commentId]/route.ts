import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import admin from "@/app/lib/firebaseAdmin";

const sql = neon(process.env.DATABASE_URL!);

export async function DELETE(
  req: Request,
  { params }: { params: { commentId: string } }
) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Fetch comment to check ownership
    const comment = await sql`
      SELECT user_id FROM comments WHERE id = ${params.commentId}
    `;

    if (comment.length === 0) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (comment[0].user_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete comment
    await sql`DELETE FROM comments WHERE id = ${params.commentId}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Error deleting comment:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
