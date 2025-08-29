import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const source_id    = searchParams.get("source_id");           // 'tiktok_trends' | 'google_trends' | 'all'
  const country      = searchParams.get("country");             // 'US' | 'UK' | ...
  const category_key = searchParams.get("category_key");        // 'tech_electronics' | 'vehicle_transportation'
  const window_period= searchParams.get("window_period");       // '1d' | '7d' | '30d'
  const sort         = searchParams.get("sort") || "collected_at_desc"; // collected_at_desc | rank_asc | score_desc
  const limit        = Math.min(Number(searchParams.get("limit") || 50), 200); // 上限 200
  const offset       = Math.max(Number(searchParams.get("offset") || 0), 0);

  // 组 where
  const wh: string[] = [];
  const vals: any[] = [];
  const add = (cond: string, v: any) => { vals.push(v); wh.push(`${cond} $${vals.length}`); };

  if (source_id && source_id !== "all") add("source_id =", source_id);
  if (country)      add("country =", country);
  if (category_key) add("category_key =", category_key);
  if (window_period)add("window_period =", window_period);

  // 排序
  let orderBy = "collected_at desc, rank asc";
  if (sort === "rank_asc") orderBy = "rank asc nulls last, collected_at desc";
  if (sort === "score_desc") orderBy = "raw_score desc nulls last, collected_at desc";

  const dsn =
    process.env.PG_DSN_POOL ||
    process.env.PG_DSN ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING;

  const { Client } = await import("pg");
  const client = new Client({ connectionString: dsn, ssl: { rejectUnauthorized: false } });
  await client.connect();

  // total
  const sqlCount = `
    select count(*)::int as total
    from trend_raw
    ${wh.length ? `where ${wh.join(" and ")}` : ""}`;
  const totalRes = await client.query(sqlCount, vals);
  const total = totalRes.rows?.[0]?.total ?? 0;

  // rows
  const sqlRows = `
    select source_id, country, category_key, window_period, keyword, rank, raw_score, meta_json, collected_at
    from trend_raw
    ${wh.length ? `where ${wh.join(" and ")}` : ""}
    order by ${orderBy}
    limit ${limit} offset ${offset}
  `;
  const rowsRes = await client.query(sqlRows, vals);
  await client.end();

  return NextResponse.json({
    ok: true,
    total,
    limit,
    offset,
    rows: rowsRes.rows,
  });
}

