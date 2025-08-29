import { NextResponse } from "next/server";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const source_id = searchParams.get("source_id");
  const country = searchParams.get("country");
  const category_key = searchParams.get("category_key");
  const window_period = searchParams.get("window_period");
  const limit = Number(searchParams.get("limit") || 100);

  const dsn =
    process.env.PG_DSN_POOL ||
    process.env.PG_DSN ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING;

  const { Client } = await import("pg");
  const client = new Client({ connectionString: dsn, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const wh = [];
  const vals: any[] = [];
  if (source_id && source_id !== 'all') { wh.push(`source_id = $${vals.length+1}`); vals.push(source_id); }
  if (country)      { wh.push(`country = $${vals.length+1}`);      vals.push(country); }
  if (category_key) { wh.push(`category_key = $${vals.length+1}`); vals.push(category_key); }
  if (window_period){ wh.push(`window_period = $${vals.length+1}`); vals.push(window_period); }

  const sql = `
    select source_id, country, category_key, window_period, keyword, rank, raw_score, meta_json,
           collected_at
    from trend_raw
    ${wh.length ? `where ${wh.join(' and ')}` : ""}
    order by collected_at desc, rank asc
    limit ${Math.min(limit, 500)}
  `;
  const r = await client.query(sql, vals);
  await client.end();
  return NextResponse.json({ ok: true, rows: r.rows });
}
