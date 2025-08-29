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
  const mode         = (searchParams.get("mode") || "all").toLowerCase(); // 'all' | 'latest'
  const limit        = Math.min(Number(searchParams.get("limit") || 50), 200);
  const offset       = Math.max(Number(searchParams.get("offset") || 0), 0);

  // where
  const wh: string[] = [];
  const vals: any[] = [];
  const add = (cond: string, v: any) => { vals.push(v); wh.push(`${cond} $${vals.length}`); };

  if (source_id && source_id !== "all") add("source_id =", source_id);
  if (country)      add("country =", country);
  if (category_key) add("category_key =", category_key);
  if (window_period)add("window_period =", window_period);

  // order
  let orderRows = "collected_at desc, rank asc nulls last";
  if (sort === "rank_asc")   orderRows = "rank asc nulls last, collected_at desc";
  if (sort === "score_desc") orderRows = "raw_score desc nulls last, collected_at desc";

  const dsn =
    process.env.PG_DSN_POOL ||
    process.env.PG_DSN ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING;

  const { Client } = await import("pg");
  const client = new Client({ connectionString: dsn, ssl: { rejectUnauthorized: false } });
  await client.connect();

  if (mode === "latest") {
    // LATEST 模式：
    // 1) total = 去重后的组合键数量
    const sqlCount = `
      select count(distinct (source_id, country, category_key, window_period, keyword))::int as total
      from trend_raw
      ${wh.length ? `where ${wh.join(" and ")}` : ""}
    `;
    const totalRes = await client.query(sqlCount, vals);
    const total = totalRes.rows?.[0]?.total ?? 0;

    // 2) rows = DISTINCT ON(...) 每组取最新一条（按 collected_at desc, rank asc）
    // 再对结果应用排序 + 分页
    const sqlRows = `
      with base as (
        select distinct on (source_id, country, category_key, window_period, keyword)
               source_id, country, category_key, window_period, keyword, rank, raw_score, meta_json, collected_at
        from trend_raw
        ${wh.length ? `where ${wh.join(" and ")}` : ""}
        order by source_id, country, category_key, window_period, keyword, collected_at desc, rank asc nulls last
      )
      select *
      from base
      order by ${orderRows}
      limit ${limit} offset ${offset}
    `;
    const rowsRes = await client.query(sqlRows, vals);
    await client.end();
    return NextResponse.json({ ok: true, mode: "latest", total, limit, offset, rows: rowsRes.rows });
  }

  // ALL 模式（原逻辑）
  const sqlCount = `
    select count(*)::int as total
    from trend_raw
    ${wh.length ? `where ${wh.join(" and ")}` : ""}`;
  const totalRes = await client.query(sqlCount, vals);
  const total = totalRes.rows?.[0]?.total ?? 0;

  const sqlRows = `
    select source_id, country, category_key, window_period, keyword, rank, raw_score, meta_json, collected_at
    from trend_raw
    ${wh.length ? `where ${wh.join(" and ")}` : ""}
    order by ${orderRows}
    limit ${limit} offset ${offset}
  `;
  const rowsRes = await client.query(sqlRows, vals);
  await client.end();

  return NextResponse.json({ ok: true, mode: "all", total, limit, offset, rows: rowsRes.rows });
}

