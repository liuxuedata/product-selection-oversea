// app/api/jobs/fetch-tiktok/route.ts
import { NextResponse } from "next/server";
import fs from "fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 全局兜底：关闭 TLS 证书校验 & PG sslmode no-verify
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    process.env.PGSSLMODE = "no-verify";

    // 1) 写回 TikTok 登录态
    if (process.env.TTC_STATE_JSON) {
      const p = "/tmp/tiktok_state.json";
      fs.writeFileSync(p, process.env.TTC_STATE_JSON, "utf8");
      process.env.TTC_STATE_FILE = p;
    }

    // 2) 选择 DSN（优先连接池）
    const dsn =
      process.env.PG_DSN_POOL ||
      process.env.PG_DSN ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_URL_NON_POOLING;

    if (!dsn) {
      return NextResponse.json(
        { ok: false, error: "Missing DSN (PG_DSN_POOL/PG_DSN/POSTGRES_URL…)" },
        { status: 500 }
      );
    }

    // 3) 动态导入 pg
    const { Client } = await import("pg");

    // 强制禁用证书校验（再兜底一次）
    const client = new Client({
      connectionString: dsn,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    // 4) 自检查询
    const meta = await client.query("select now() as now, current_database() as db");
    let rawToday: number | null = null;
    try {
      const r = await client.query(
        "select count(*)::int as c from trend_raw where collected_at::date = current_date"
      );
      rawToday = r?.rows?.[0]?.c ?? 0;
    } catch {
      rawToday = null; // 表未建则忽略
    }

    await client.end();

    return NextResponse.json({
      ok: true,
      db: meta.rows?.[0]?.db,
      now: meta.rows?.[0]?.now,
      stateFile: process.env.TTC_STATE_FILE || null,
      rawToday,
      note: "已在路由内关闭 TLS 校验（NODE_TLS_REJECT_UNAUTHORIZED=0 + PGSSLMODE=no-verify）并设置 ssl.rejectUnauthorized=false。"
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e), stack: e?.stack },
      { status: 500 }
    );
  }
}
