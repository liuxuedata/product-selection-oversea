// app/api/jobs/fetch-google/route.ts
import { NextResponse } from "next/server";

// Vercel/Next
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Google Trends 国家代码映射（google-trends-api 用的是 "US"/"GB"/"FR"/"DE" 这类）
const SUPPORTED = new Set(["US", "UK", "GB", "FR", "DE"]);
const COUNTRY_ALIAS: Record<string, string> = { UK: "GB" };

const REGION_MAP: Record<string, { gt: string; ttc: string }> = {
  US: { gt: "US", ttc: "US" },
  GB: { gt: "GB", ttc: "GB" },
  FR: { gt: "FR", ttc: "FR" },
  DE: { gt: "DE", ttc: "DE" },
};

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}

async function handle(req: Request) {
  const url = new URL(req.url);
  const countryRaw = (url.searchParams.get("country") || "US").toUpperCase();
  const country = COUNTRY_ALIAS[countryRaw] || countryRaw;
  const category_key = url.searchParams.get("category_key") || "tech_electronics";
  const window_period = url.searchParams.get("window_period") || "7d";

  if (!SUPPORTED.has(country)) {
    return NextResponse.json({ ok: false, error: `country not supported: ${countryRaw}` }, { status: 400 });
  }

  const dsn =
    process.env.PG_DSN_POOL ||
    process.env.PG_DSN ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING;
  if (!dsn) return NextResponse.json({ ok: false, error: "Missing PG DSN" }, { status: 500 });

  try {
    const gtrends = await import("google-trends-api");
    const mod = await import("pg");
    const { Client } = (mod as any).default || (mod as any);

    const client = new Client({ connectionString: dsn, ssl: { rejectUnauthorized: false } });
    await client.connect();

    // 确保字典表
    const region = REGION_MAP[country] || { gt: country, ttc: country };
    await client.query(
      `insert into trend_source(source_id, display_name)
       values('google_trends','Google Trends')
       on conflict(source_id) do update set display_name=excluded.display_name`
    );
    await client.query(
      `insert into country_map(country, gt_geo, ttc_region)
       values($1,$2,$3)
       on conflict(country) do update set gt_geo=excluded.gt_geo, ttc_region=excluded.ttc_region`,
      [country, region.gt, region.ttc]
    );
    await client.query(
      `insert into trend_category_map(category_key)
       values($1) on conflict(category_key) do nothing`,
      [category_key]
    );

    // 拉热门搜索
    const trending = await gtrends.trendingSearches({ geo: country });
    const items: string[] = [];
    try {
      const obj = JSON.parse(trending);
      const arr = obj?.default?.trendingSearchesDays?.[0]?.trendingSearches ?? [];
      for (const it of arr) {
        const kw = it?.title?.query;
        if (kw && typeof kw === "string") items.push(kw.trim());
      }
    } catch {}

    // 处理数据并插入数据库
    let ok = 0, fail = 0;

    for (const kw of items) {
      try {
        const res = await gtrends.interestOverTime({
          keyword: kw,
          startTime: new Date(Date.now() - 7 * 24 * 3600 * 1000),
          endTime: new Date(),
          geo: country,
        });
        const j = JSON.parse(res);
        const vals = j?.default?.timelineData ?? [];
        const last = vals.length ? vals[vals.length - 1] : null;
        const score = last ? Number(last.value?.[0] ?? 0) : null;

        await client.query(
          `insert into trend_raw
            (source_id, country, category_key, window_period, keyword, rank, raw_score, meta_json, collected_at)
           values
            ($1,$2,$3,$4,$5,$6,$7,$8::jsonb, now())
           on conflict do nothing`,
          [
            "google_trends",
            country,
            category_key,
            "7d",
            kw,
            null,
            score,
            JSON.stringify({ from: "trending_searches" }),
          ]
        );
        ok++;
      } catch {
        fail++;
      }
    }

    await client.end();
    return NextResponse.json({ ok: true, inserted: ok, failed: fail, country, window_period, category_key });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
