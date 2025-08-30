// app/api/trends/search/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 支持的排序键
const SORT_SQL: Record<string, string> = {
  collected_at_desc: "collected_at desc nulls last",
  rank_asc: "rank asc nulls last, collected_at desc",
  score_desc: "raw_score desc nulls last, collected_at desc",
};

function pickSort(sort?: string) {
  return SORT_SQL[sort || "collected_at_desc"] || SORT_SQL.collected_at_desc;
}

type QS = {
  source_id?: string | null;
  country?: string | null;
  category_key?: string | null;
  window_period?: string | null;
  keyword?: string | null; // 精确
  q?: string | null;       // 模糊 ilike
  mode?: "latest" | "all" | null;
  sort?: string | null;
  limit?: string | null;
  offset?: string | null;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const p = Object.fromEntries(url.searchParams.entries()) as QS;

  const source_id    = p.source_id && p.source_id !== "all" ? p.source_id : null;
  const country      = p.country || null;
  const category_key = p.category_key || null;
  const window_p     = p.window_period || null;
  const keyword      = p.keyword || null; // 精确
  const q            = p.q || null;       // 模糊
  const mode         = (p.mode as any) === "all" ? "all" : "latest";
  const sortSql      = pickSort(p.sort || undefined);
  const limit        = Math.max(1, Math.min(1000, Number(p.limit ?? 50)));
  const offset       = Math.max(0, Number(p.offset ?? 0));

  const dsn =
    process.env.PG_DSN_POOL ||
    process.env.PG_DSN ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING;

  if (!dsn) {
    return NextResponse.json({ ok: false, error: "Missing PG DSN" }, { status: 500 });
  }

  // 动态导入 pg，避免打包期报错
  const mod = await import("pg");
  const { Client } = (mod as any).default || (mod as any);
  const client = new Client({ connectionString: dsn, ssl: { rejectUnauthorized: false } });

  // 组装 where
  const wh: string[] = [];
  const vals: any[] = [];
  const add = (cond: string, v: any) => {
    vals.push(v);
    wh.push(`${cond} $${vals.length}`);
  };

  if (source_id)    add("source_id =", source_id);
  if (country)      add("country =", country);
  if (category_key) add("category_key =", category_key);
  if (window_p)     add("window_period =", window_p);
  if (keyword)      add("keyword =", keyword);
  if (q) { // 模糊
    vals.push(`%${q}%`);
    wh.push(`keyword ilike $${vals.length}`);
  }

  const whereSql = wh.length ? `where ${wh.join(" and ")}` : "";

  // latest: 按 (source_id,country,category_key,window_period,keyword) 取最新一条
  const groupKeys = "source_id,country,category_key,window_period,keyword";

  try {
    await client.connect();

    let total = 0;
    let rows: any[] = [];

    if (mode === "latest") {
      // 统计总数：distinct 组数量
      const countSql = `
        select count(*)::int as c
        from (
          select distinct ${groupKeys}
          from trend_raw
          ${whereSql}
        ) t
      `;
      const c = await client.query(countSql, vals);
      total = c.rows?.[0]?.c ?? 0;

      // 先 distinct on 取最新，再分页
      const sql = `
        with dedup as (
          select distinct on (${groupKeys})
                 ${groupKeys}, rank, raw_score, meta_json, collected_at
          from trend_raw
          ${whereSql}
          order by ${groupKeys}, collected_at desc
        )
        select *
        from dedup
        order by ${sortSql}
        limit ${limit} offset ${offset}
      `;
      const r = await client.query(sql, vals);
      rows = r.rows ?? [];
    } else {
      // all：直接 count(*) + order by 分页
      const countSql = `select count(*)::int as c from trend_raw ${whereSql}`;
      const c = await client.query(countSql, vals);
      total = c.rows?.[0]?.c ?? 0;

      const sql = `
        select ${groupKeys}, rank, raw_score, meta_json, collected_at
        from trend_raw
        ${whereSql}
        order by ${sortSql}
        limit ${limit} offset ${offset}
      `;
      const r = await client.query(sql, vals);
      rows = r.rows ?? [];
    }

    await client.end();
    return NextResponse.json({
      ok: true,
      mode,
      total,
      limit,
      offset,
      rows,
    });
  } catch (e: any) {
    try { await client.end(); } catch {}
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}

