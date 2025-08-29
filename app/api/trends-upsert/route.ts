import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = {
  source_id?: string;            // 'tiktok_trends' | 'google_trends'
  country: string;               // US/UK/FR/DE...
  category_key: string;          // 'tech_electronics' | 'vehicle_transportation'
  window_period: string;         // '1d' | '7d' | '30d'
  keyword: string;
  rank?: number | null;
  raw_score?: number | null;
  meta_json?: any;
  collected_at?: string | null;  // 可为空，后端用 now()
};

export async function GET() {
  return NextResponse.json({ ok: true, hint: "POST rows[] to upsert trends" });
}

export async function POST(req: Request) {
  try {
    const items = await req.json();
    const rows: Row[] = Array.isArray(items) ? items : [items];

    const dsn =
      process.env.PG_DSN_POOL ||
      process.env.PG_DSN ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_URL_NON_POOLING;

    const { Client } = await import("pg");
    const client = new Client({ connectionString: dsn, ssl: { rejectUnauthorized: false } });
    await client.connect();

    const ensureSource = `insert into trend_source(source_id, display_name)
                          values($1,$2) on conflict(source_id) do update set display_name=excluded.display_name`;
    const ensureCountry = `insert into country_map(country, gt_geo, ttc_region)
                           values($1,$2,$3) on conflict(country) do update set gt_geo=excluded.gt_geo, ttc_region=excluded.ttc_region`;
    const ensureCategory = `insert into trend_category_map(category_key)
                            values($1) on conflict(category_key) do nothing`;

    const insertRaw = `
      insert into trend_raw
        (source_id, country, category_key, window_period, keyword, rank, raw_score, meta_json, collected_at)
      values
        ($1,$2,$3,$4,$5,$6,$7,$8, coalesce($9, now()))
      on conflict do nothing`;

    const geoMap: Record<string, {gt:string, ttc:string}> = {
      US:{gt:'US',ttc:'US'}, UK:{gt:'GB',ttc:'GB'}, FR:{gt:'FR',ttc:'FR'}, DE:{gt:'DE',ttc:'DE'}
    };

    let ok = 0, fail = 0;
    for (const r of rows) {
      try {
        const src = (r.source_id ?? 'tiktok_trends');
        const region = geoMap[r.country] ?? {gt: r.country, ttc: r.country};
        await client.query('begin');
        await client.query(ensureSource,   [src, src === 'google_trends' ? 'Google Trends' : 'TikTok Trends']);
        await client.query(ensureCountry,  [r.country, region.gt, region.ttc]);
        await client.query(ensureCategory, [r.category_key]);
        await client.query(insertRaw, [
          src, r.country, r.category_key, r.window_period, r.keyword,
          r.rank ?? null, r.raw_score ?? null, r.meta_json ?? {}, r.collected_at ?? null
        ]);
        await client.query('commit');
        ok++;
      } catch (e) {
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
