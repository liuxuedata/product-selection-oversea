// Requirements: npm i playwright pg
// ENV: PG_DSN, TTC_STATE_FILE (path to storageState JSON), TTC_THROTTLE_MS (default 1500)

import { chromium } from 'playwright';
import { Client } from 'pg';

type Item = { keyword?: string; hashtag?: string; score?: number; rank?: number; timeseries?: any };

async function scrapeChannel(page, region: string, channel: string): Promise<Item[]> {
  // TODO: 打开 TikTok Creative Center 对应 region+channel 页面；
  // 通过 page.on('response') 捕获 XHR JSON；解析为 Item[]。
  // 此处为占位返回，便于你先打通管线。
  return [];
}

function passRules(word: string, include: string[], exclude: string[]) {
  const W = (word||'').toLowerCase();
  if (!W) return false;
  if (exclude?.some((e: string) => new RegExp(e, 'i').test(W))) return false;
  if (!include || include.length === 0) return true;
  return include.some((e: string) => new RegExp(e, 'i').test(W));
}

(async () => {
  const dsn = process.env.PG_DSN;
  if (!dsn) { console.error("Missing PG_DSN env."); process.exit(1); }

  const pg = new Client({ connectionString: dsn });
  await pg.connect();

  const browser = await chromium.launch();
  const context = await browser.newContext({ storageState: process.env.TTC_STATE_FILE || 'tiktok_state.json' });
  const page = await context.newPage();

  const countries = (await pg.query(`select country, ttc_region from country_map`)).rows;
  const cats = (await pg.query(`
    select category_key, ttc_channel, include_rules, exclude_rules
    from trend_category_map where ttc_channel is not null
  `)).rows;

  for (const c of countries) {
    for (const cat of cats) {
      try {
        const items = await scrapeChannel(page, c.ttc_region, cat.ttc_channel);
        const include = Array.isArray(cat.include_rules) ? cat.include_rules : [];
        const exclude = Array.isArray(cat.exclude_rules) ? cat.exclude_rules : [];

        const filtered = items.filter(x => passRules(x.keyword || x.hashtag || '', include, exclude));
        if (filtered.length === 0) {
          console.log(`[info] no items for ${c.country} / ${cat.category_key}`);
          await page.waitForTimeout(Number(process.env.TTC_THROTTLE_MS || 1500));
          continue;
        }

        const rows = filtered.map((x, i) => ({
          source_id: 'tiktok_trends',
          country: c.country,
          category_key: cat.category_key,
          window: '7d', // 或按真实接口改为 '30d'
          keyword: x.keyword || x.hashtag || '',
          rank: x.rank ?? (i + 1),
          raw_score: x.score ?? null,
          meta_json: JSON.stringify({ timeseries: x.timeseries, channel: cat.ttc_channel })
        }));

        // 批量插入
        const values = rows.map((_, i) =>
          `($${i*8+1},$${i*8+2},$${i*8+3},$${i*8+4},$${i*8+5},$${i*8+6},$${i*8+7}, now(), $${i*8+8})`
        ).join(',');

        const sql = `
          insert into trend_raw
            (source_id, country, category_key, window_period, keyword, rank, raw_score, collected_at, meta_json)
          values ${values}
          on conflict do nothing
        `;
        const params = rows.flatMap(r => [r.source_id, r.country, r.category_key, r.window, r.keyword, r.rank, r.raw_score, r.meta_json]);
        await pg.query(sql, params);

        console.log(`[ok] tiktok_trends ${c.country} ${cat.category_key}: ${rows.length} rows`);
        await page.waitForTimeout(Number(process.env.TTC_THROTTLE_MS || 1500));
      } catch (e) {
        console.error(`[warn] ${c.country}/${cat.category_key} error:`, e);
      }
    }
  }

  await browser.close();
  await pg.end();
})();
