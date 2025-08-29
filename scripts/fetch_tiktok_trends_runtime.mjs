// scripts/fetch_tiktok_trends_runtime.mjs
// 说明：
// - 这是给 /app/api/jobs/fetch-tiktok/route.ts 动态 import 的运行器。
// - 只做连通性/状态检查，不含 Playwright 抓取（建议放到 GitHub Actions 跑）。
// - 采用“动态导入 pg”，配合 next.config.js 中的 externalPackages 设置，避免 Vercel 构建错误。

import fs from "fs";

/**
 * 运行器（连通性检查版）
 * @param {Object} opts
 * @param {string} [opts.dsn]        - 优先使用的数据库连接串（可传 PG_DSN_POOL）
 * @param {string} [opts.stateFile]  - TikTok storageState.json 路径（不传则读 env）
 * @returns {Promise<Object>}        - 结果对象（ok/db/now/stateExists/rawToday等）
 */
export default async function run(opts = {}) {
  // 1) 读取登录态文件路径并检查是否存在
  const statePath = opts.stateFile || process.env.TTC_STATE_FILE || "/tmp/tiktok_state.json";
  const stateExists = safeExists(statePath);

  // 2) 选择数据库连接串：优先连接池，其次直连
  const dsn =
    opts.dsn ||
    process.env.PG_DSN_POOL ||
    process.env.PG_DSN ||
    process.env.POSTGRES_URL ||                 // Vercel 内置（pooler）
    process.env.POSTGRES_URL_NON_POOLING;       // Vercel 内置（direct）

  if (!dsn) {
    return {
      ok: false,
      error: "Missing PG_DSN/PG_DSN_POOL (or POSTGRES_URL/POSTGRES_URL_NON_POOLING)",
      hint: "在 Vercel 环境变量里把 POSTGRES_URL 赋值到 PG_DSN_POOL，把 POSTGRES_URL_NON_POOLING 赋值到 PG_DSN。",
    };
  }

  // 3) 动态导入 pg（避免构建期打包）
  // ...
const mod = await import("pg");
const { Client } = mod.default || mod;

  // 4) 连接数据库并做几条轻量查询
 
const client = new Client({
  connectionString: dsn,
  ssl: { rejectUnauthorized: false }   // 这里
});
await client.connect();
// ...


  // now & db
  const meta = await client.query("select now() as now, current_database() as db");

  // trend_source / 今日 trend_raw 计数（表存在即可）
  let rawToday = null;
  try {
    const r = await client.query(
      "select count(*)::int as c from trend_raw where collected_at::date = current_date"
    );
    rawToday = r?.rows?.[0]?.c ?? 0;
  } catch {
    // 表可能未建，忽略
    rawToday = null;
  }

  // 也顺带看一眼基础表是否存在
  const rels = await client.query(`
    select relname
    from pg_class
    where relkind='r' and relname = any($1)
  `, [[
    "trend_source", "trend_category_map", "country_map",
    "trend_raw", "trend_keyword_daily", "keyword_pool"
  ]]);

  await client.end();

  return {
    ok: true,
    db: meta.rows?.[0]?.db,
    now: meta.rows?.[0]?.now,
    statePath,
    stateExists,
    rawToday,                       // 如果为 null，多半是表未建；为数字则是今日条数
    tablesFound: rels.rows.map(r => r.relname),
    note:
      "运行器已通。建议把 Playwright 抓取放到 GitHub Actions 跑；Vercel 侧仅触发与展示。"
  };
}

/** 安全判断文件是否存在（避免异常） */
function safeExists(p) {
  try { return fs.existsSync(p); } catch { return false; }
}

