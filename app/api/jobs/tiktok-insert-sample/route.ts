// app/api/jobs/tiktok-insert-sample/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function doInsert() {
  // 兜底关闭证书校验，避免 self-signed 报错
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  process.env.PGSSLMODE = "no-verify";

  const dsn =
    process.env.PG_DSN_POOL ||
    process.env.PG_DSN ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING;

  if (!dsn) {
    return { ok: false, error: "Missing DSN (PG_DSN_POOL/PG_DSN/...)" };
  }

  const { Client } = await import("pg");
  const client = new Client({ connectionString: dsn, ssl: { rejectUnauthorized: false } });
  await client.connect();

  // 1) 读取 trend_raw 实际列
  const colsRes = await client.query(
    `select column_name, data_type
     from information_schema.columns
     where table_schema = 'public' and table_name = 'trend_raw'
     order by ordinal_position`
  );
  const columns = colsRes.rows.map((r: any) => r.column_name);

  // 2) 准备一条样例数据（接近我们的抓取结果）
  const sample = {
    source_id: "tiktok_trends",
    country: "US",
    category_key: "tech_electronics",
    window_period: "7d",
    keyword: "sample-keyword",
    rank: 1,
    raw_score: 99.9,
    meta_json: { demo: true },
    collected_at: new Date().toISOString()
  };

  // 3) 选取 trend_raw 里“确实存在”的列来构造 INSERT
  const preferredOrder = [
    "source_id",
    "country",
    "category_key",
    "window_period",
    "keyword",
    "rank",
    "raw_score",
    "meta_json",
    "collected_at"
  ];
  const useCols = preferredOrder.filter(c => columns.includes(c));
  if (useCols.length === 0) {
    await client.end();
    return { ok: false, error: "trend_raw has no expected columns", columns };
  }

  const placeholders = useCols.map((_, i) => `$${i + 1}`).join(",");
  const sql = `insert into trend_raw (${useCols.join(",")}) values (${placeholders}) returning *`;

  // meta_json 如果存在，转 json
  const values = useCols.map(c => (c === "meta_json" ? JSON.stringify(sample[c as keyof typeof sample] ?? {}) : (sample as any)[c]));

  try {
    const r = await client.query(sql, values);
    await client.end();
    return { ok: true, inserted: r.rows[0], used_columns: useCols, all_columns: columns };
  } catch (e: any) {
    const errRes = {
      ok: false,
      error: String(e?.message || e),
      used_columns: useCols,
      all_columns: columns,
      sql
    };
    try { await client.end(); } catch {}
    return errRes;
  }
}

export async function GET() {
  const res = await doInsert();
  return NextResponse.json(res, { status: res.ok ? 200 : 500 });
}

export async function POST() {
  const res = await doInsert();
  return NextResponse.json(res, { status: res.ok ? 200 : 500 });
}

