import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const dsn =
      process.env.PG_DSN_POOL ||
      process.env.PG_DSN ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_URL_NON_POOLING;

    const { Client } = await import("pg");
    const client = new Client({ connectionString: dsn, ssl: { rejectUnauthorized: false } });
    await client.connect();

    // 造一条“像是抓取来的”数据
    const row = {
      source_id: "tiktok_trends",
      country: "US",
      category_key: "tech_electronics",
      window_period: "7d",
      keyword: "sample-keyword",
      rank: 1,
      raw_score: 99.9,
      meta_json: { demo: true },
    };

    const sql = `
      insert into trend_raw
        (source_id, country, category_key, window_period, keyword, rank, raw_score, meta_json, collected_at)
      values
        ($1,$2,$3,$4,$5,$6,$7,$8, now())
      returning id, collected_at
    `;

    const r = await client.query(sql, [
      row.source_id, row.country, row.category_key, row.window_period,
      row.keyword, row.rank, row.raw_score, row.meta_json
    ]);

    await client.end();
    return NextResponse.json({ ok: true, inserted: r.rows[0] });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
