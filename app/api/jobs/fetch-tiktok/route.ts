// app/api/jobs/fetch-tiktok/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // 避免被静态化/缓存

export async function GET() {
  try {
    // 1) 写回 tiktok_state.json
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

    // 3) 绝对路径导入 runtime.mjs（确保调用的是你这份文件）
    const runtimeFile = path.join(process.cwd(), "scripts", "fetch_tiktok_trends_runtime.mjs");
    const { default: run } = await import(runtimeFile);

    const result = await run({ dsn, stateFile: process.env.TTC_STATE_FILE });
    return NextResponse.json(result);
  } catch (e: any) {
    // 返回完整信息以便确认栈
    return NextResponse.json({ ok: false, error: String(e?.message || e), stack: e?.stack }, { status: 500 });
  }
}
