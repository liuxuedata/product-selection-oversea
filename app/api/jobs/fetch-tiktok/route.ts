// /pages/api/jobs/fetch-tiktok.ts (Next.js pages router 示例)
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 1) 还原 tiktok_state.json
    if (process.env.TTC_STATE_JSON) {
      const statePath = '/tmp/tiktok_state.json';
      fs.writeFileSync(statePath, process.env.TTC_STATE_JSON, 'utf8');
      process.env.TTC_STATE_FILE = statePath;
    }

    // 2) 选择连接串：优先连接池
    process.env.PG_DSN = process.env.PG_DSN || process.env.POSTGRES_URL_NON_POOLING || '';
    const dsn = process.env.PG_DSN_POOL || process.env.PG_DSN || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;
    if (!dsn) {
      res.status(500).json({ ok: false, error: 'Missing PG_DSN/PG_DSN_POOL' });
      return;
    }

    // 3) 动态导入脚本（复用你仓库里的 ts 代码；若是 ts 源码，可改成编译后的 js 或用 ts-node/tsx 运行）
    const { default: run } = await import('../../../scripts/fetch_tiktok_trends_runtime.mjs').catch(() => ({ default: null }));

    if (!run) {
      // 备选：内联一个极简 runner，直接 import 你的 ts/js（若是 ts，请用已构建后的 js 版本）
      // 建议把 scripts/fetch_tiktok_trends.ts 构建为 JS：例如存一份 scripts/fetch_tiktok_trends.runtime.mjs
      res.status(500).json({ ok: false, error: 'No runtime script found. Build a JS runner for Vercel.' });
      return;
    }

    const out = await run({ dsn, stateFile: process.env.TTC_STATE_FILE });
    res.status(200).json({ ok: true, result: out });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
