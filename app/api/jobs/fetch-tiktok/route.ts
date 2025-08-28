// app/api/jobs/fetch-tiktok/route.ts  (Next.js App Router)
import { NextResponse } from "next/server";
import fs from "fs";

export const runtime = "nodejs";          // 不能用 edge
export const dynamic = "force-dynamic";   // 避免被静态化

export async function GET() {
  try {
    // 1) 把环境变量里的 JSON 内容写回 /tmp
    if (process.env.TTC_STATE_JSON) {
      const statePath = "/tmp/tiktok_state.json";
      fs.writeFileSync(statePath, process.env.TTC_STATE_JSON, "utf8");
      process.env.TTC_STATE_FILE = statePath;
    }

    // 2) 动态导入运行器（就是上面新建的 mjs）
    const mod = await import("../../../../scripts/fetch_tiktok_trends_runtime.mjs");

    const run = mod?.default;
    if (!run) throw new Error("Cannot load runtime module");

    // 3) 选择连接串（优先连接池）
    const dsn =
      process.env.PG_DSN_POOL ||
      process.env.PG_DSN ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_URL_NON_POOLING;

    const result = await run({ dsn, stateFile: process.env.TTC_STATE_FILE });
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
