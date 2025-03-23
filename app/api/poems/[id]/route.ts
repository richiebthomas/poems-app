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


