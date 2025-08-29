// app/api/debug/pg/route.ts
import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dsn =
      process.env.PG_DSN_POOL ||
      process.env.PG_DSN ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_URL_NON_POOLING;

    if (!dsn) return NextResponse.json({ ok: false, error: "Missing DSN" }, { status: 500 });

    const mod = await import("pg");
    const { Client } = (mod as any).default || mod;

    const client = new Client({
      connectionString: dsn,
      ssl: { rejectUnauthorized: false } // 关键
    });
    await client.connect();

    const { rows } = await client.query("select now() as now, current_database() as db");
    await client.end();

    return NextResponse.json({ ok: true, db: rows[0]?.db, now: rows[0]?.now });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e), stack: e?.stack }, { status: 500 });
  }
}
