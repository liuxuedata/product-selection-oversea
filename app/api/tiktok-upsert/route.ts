import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const items = await req.json();
    const rows = Array.isArray(items) ? items : [items];

    const dsn =
      process.env.PG_DSN_POOL ||
      process.env.PG_DSN ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_URL_NON_POOLING;

    const { Client } = await import("pg");
    const client = new Client({ connectionString: dsn, ssl: { rejectUnauthorized: false } });
    await client.connect();

    // 先 ensure 字典值
    const ensureSource = `insert into trend_source(source_id, display_name)
                          values($1, $2) on conflict(source_id) do update set display_name=excluded.display_name`;
    const ensureCountry = `insert into country_map(country, gt_geo, ttc_region)
                           values($1,$2,$3) on conflict(country) do update set gt_geo=excluded.gt_geo, ttc_region=excluded.ttc_region`;
    const ensureCategory = `insert into trend_category_map(category_key)
                            values($1) on conflict(category_key) do nothing`;

    const insertRaw = `
      insert into trend_raw
        (source_id, country, category_key, window_period, keyword, rank, raw_score, meta_json, collected_at)
      values
        ($1,$2,$3,$4,$5,$6,$7,$8, coalesce($9, now()))
      on conflict do nothing
    `;

    let ok = 0, fail = 0;
    for (const r of rows) {
      try {
        // r.source_id / r.country_map 信息是抓取时决定的；默认用 tiktok_trends + 简单映射
        const source_id  = r.source_id  ?? 'tiktok_trends';
        const country    = r.country    ?? 'US';
        const category   = r.category_key ?? 'tech_electronics';
        const window_p   = r.window_period ?? '7d';

        // 可选：根据国家给出默认的 gt_geo / ttc_region
        const geoMap: Record<string, {gt:string, ttc:string}> = {
          US: {gt:'US', ttc:'US'}, UK: {gt:'GB', ttc:'GB'}, FR: {gt:'FR', ttc:'FR'}, DE: {gt:'DE', ttc:'DE'}
        };
        const region = geoMap[country] ?? {gt: country, ttc: country};

        await client.query('begin');
        await client.query(ensureSource,   [source_id, 'TikTok Trends']);
        await client.query(ensureCountry,  [country, region.gt, region.ttc]);
        await client.query(ensureCategory, [category]);

        await client.query(insertRaw, [
          source_id,
          country,
          category,
          window_p,
          r.keyword,
          r.rank ?? null,
          r.raw_score ?? null,
          r.meta_json ?? {},
          r.collected_at ?? null
        ]);
        await client.query('commit');
        ok++;
      } catch {
        await client.query('rollback');
        fail++;
      }
    }

    await client.end();
    return NextResponse.json({ ok: true, inserted: ok, failed: fail });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
