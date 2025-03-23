import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in environment variables!");
}

const sql = neon(process.env.DATABASE_URL!);

export async function DELETE(req: Request, { params }: { params: { commentId: string } }) {
  try {
    const { commentId } = params;
    await sql`
      DELETE FROM comments WHERE id = ${commentId}
    `;
    return NextResponse.json({ success: true, message: "Comment deleted" }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting comment:", error.message);
    return NextResponse.json({ error: "Failed to delete comment", details: error.message }, { status: 500 });
  }
}
