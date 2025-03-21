import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";

// Use the Neon PostgreSQL connection URL from environment variables
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Required for Neon
});

interface Database {
  poems: {
    id: string;
    text: string;
    background: string | null;
    music: string | null;
    author: string;
    created_at: string;
  };
}

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({ pool }),
});
