// app/api/jobs/fetch-tiktok/route.ts
import { NextResponse } from "next/server";
import fs from "fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
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

    // 2) 获取查询参数
    const url = new URL(req.url);
    const country = url.searchParams.get('country') || 'US';
    const category_key = url.searchParams.get('category_key') || 'tech_electronics';
    const window_period = url.searchParams.get('window_period') || '7d';

    // 3) 选择 DSN（优先连接池）
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

    // 4) 动态导入 pg
    const { Client } = await import("pg");

    // 强制禁用证书校验（再兜底一次）
    const client = new Client({
      connectionString: dsn,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    // 5) 自检查询
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

      // 6) 运行真实的TikTok爬虫
      let scraperResult = null;
      try {
        // 动态导入爬虫
        const { default: TikTokTrendsScraper } = await import("../../../scripts/fetch_tiktok_trends");
        const scraper = new TikTokTrendsScraper();

        // 设置环境变量
        process.env.PG_DSN = dsn;
        process.env.MARKETS = country;
        process.env.CATEGORIES = category_key;
        process.env.WINDOWS = window_period;

        await scraper.init();
        const trends = await scraper.scrapeTrends();
        await scraper.saveToDatabase(trends);
        await scraper.cleanup();

        scraperResult = {
          success: true,
          trendsCount: trends.length,
          message: `成功爬取 ${trends.length} 条TikTok趋势数据`,
          trends: trends.slice(0, 5) // 只返回前5条作为示例
        };
      } catch (scraperError: any) {
        console.error('TikTok爬虫执行失败:', scraperError);
        
        // 如果爬虫失败，回退到测试数据
        try {
          const testData = {
            source_id: 'tiktok_trends',
            country: country,
            category_key: category_key,
            window_period: window_period,
            keyword: `fallback_keyword_${Date.now()}`,
            rank: 1,
            raw_score: Math.floor(Math.random() * 50) + 50,
            meta_json: {
              fallback: true,
              scraped_at: new Date().toISOString(),
              method: 'fallback_data',
              original_error: scraperError.message
            }
          };

          const { Client } = await import("pg");
          const testClient = new Client({
            connectionString: dsn,
            ssl: { rejectUnauthorized: false }
          });

          await testClient.connect();

          await testClient.query(`
            INSERT INTO trend_raw (
              source_id, country, category_key, window_period,
              keyword, rank, raw_score, meta_json
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [
            testData.source_id,
            testData.country,
            testData.category_key,
            testData.window_period,
            testData.keyword,
            testData.rank,
            testData.raw_score,
            JSON.stringify(testData.meta_json)
          ]);

          await testClient.end();

          scraperResult = {
            success: true,
            trendsCount: 1,
            message: `爬虫失败，已插入备选数据: ${testData.keyword}`,
            fallback: true,
            error: scraperError.message,
            testData: testData
          };
        } catch (fallbackError: any) {
          scraperResult = {
            success: false,
            error: `爬虫失败: ${scraperError.message}, 备选数据也失败: ${fallbackError.message}`,
            message: "TikTok数据采集完全失败"
          };
        }
      }

    return NextResponse.json({
      ok: true,
      db: meta.rows?.[0]?.db,
      now: meta.rows?.[0]?.now,
      stateFile: process.env.TTC_STATE_FILE || null,
      rawToday,
      scraper: scraperResult,
      params: { country, category_key, window_period },
      note: "已在路由内关闭 TLS 校验（NODE_TLS_REJECT_UNAUTHORIZED=0 + PGSSLMODE=no-verify）并设置 ssl.rejectUnauthorized=false。"
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e), stack: e?.stack },
      { status: 500 }
    );
  }
}
