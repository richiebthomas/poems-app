import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import admin from "@/app/lib/firebaseAdmin";
import { v4 as uuidv4 } from "uuid";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const comments = await sql`SELECT * FROM comments WHERE poem_id = ${params.id} ORDER BY created_at ASC`;
    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { text } = await req.json();
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = authHeader.split(" ")[1];
  const decodedToken = await admin.auth().verifyIdToken(token);

  const newComment = {
    id: uuidv4(),
    text,
    user_id: decodedToken.uid,
    author: decodedToken.name || "Anonymous",
    poem_id: params.id,
    created_at: new Date().toISOString(),
  };

  await sql`
    INSERT INTO comments (id, text, user_id, author, poem_id, created_at)
    VALUES (${newComment.id}, ${newComment.text}, ${newComment.user_id}, ${newComment.author}, ${newComment.poem_id}, ${newComment.created_at})
  `;

  return NextResponse.json(newComment);
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    await sql`DELETE FROM comments WHERE id = ${params.commentId}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
