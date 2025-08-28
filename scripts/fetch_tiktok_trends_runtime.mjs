// scripts/fetch_tiktok_trends_runtime.mjs
import fs from "fs";
import pkg from "pg";
const { Client } = pkg;

/**
 * 运行器（无 Playwright 版，用于验证 Vercel 环境/连接）
 * @param {{ dsn?: string, stateFile?: string }} opts
 */
export default async function run(opts = {}) {
  // 1) 还原/检查 tiktok_state.json
  const statePath = opts.stateFile || process.env.TTC_STATE_FILE || "/tmp/tiktok_state.json";
  const stateExists = fs.existsSync(statePath);

  // 2) 连接数据库（优先连接池）
  const dsn =
    opts.dsn ||
    process.env.PG_DSN_POOL ||
    process.env.PG_DSN ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING;

  if (!dsn) throw new Error("Missing PG_DSN/PG_DSN_POOL");

  const pg = new Client({ connectionString: dsn });
  await pg.connect();

  // 3) 简单自检：读当前时间和表是否存在
  const { rows } = await pg.query("select now() as now, current_database() as db");
  await pg.end();

  return {
    ok: true,
    statePath,
    stateExists,
    db: rows[0]?.db,
    now: rows[0]?.now,
    note:
      "构建已通过 & API 可用。建议把真正的 Playwright 抓取放到 GitHub Actions 里跑，再由 Vercel 只做触发/展示。",
  };
}
