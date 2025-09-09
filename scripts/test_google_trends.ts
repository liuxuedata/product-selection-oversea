#!/usr/bin/env ts-node

/**
 * Google Trends API 测试脚本
 * 用于验证Google Trends数据采集功能
 */

import { Client } from 'pg';

// 测试配置
const TEST_CONFIG = {
  country: 'US',
  category_key: 'tech_electronics',
  window_period: '7d',
  pg_dsn: process.env.PG_DSN_POOL || process.env.PG_DSN || process.env.POSTGRES_URL
};

async function testGoogleTrendsAPI() {
  console.log('🧪 开始测试Google Trends API...');
  
  if (!TEST_CONFIG.pg_dsn) {
    console.error('❌ 缺少数据库连接字符串 (PG_DSN_POOL/PG_DSN/POSTGRES_URL)');
    process.exit(1);
  }

  try {
    // 1. 测试数据库连接
    console.log('📊 测试数据库连接...');
    const client = new Client({
      connectionString: TEST_CONFIG.pg_dsn,
      ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();
    console.log('✅ 数据库连接成功');
    
    // 2. 测试Google Trends API
    console.log('🔍 测试Google Trends API...');
    const gtrends = await import('google-trends-api');
    
    // 测试trending searches
    console.log(`📈 获取 ${TEST_CONFIG.country} 的trending searches...`);
    const trending = await gtrends.trendingSearches({ geo: TEST_CONFIG.country });
    const obj = JSON.parse(trending);
    const arr = obj?.default?.trendingSearchesDays?.[0]?.trendingSearches ?? [];
    
    console.log(`✅ 获取到 ${arr.length} 个trending searches:`);
    arr.slice(0, 5).forEach((item: any, index: number) => {
      console.log(`  ${index + 1}. ${item?.title?.query}`);
    });
    
    // 3. 测试interest over time
    console.log('📊 测试interest over time...');
    const testKeyword = 'iPhone';
    const now = Date.now();
    const spanMs = 7 * 24 * 3600 * 1000; // 7天
    const startTime = new Date(now - spanMs);
    
    const res = await gtrends.interestOverTime({
      keyword: testKeyword,
      startTime,
      endTime: new Date(),
      geo: TEST_CONFIG.country,
    });
    
    const j = JSON.parse(res);
    const vals = j?.default?.timelineData ?? [];
    const last = vals.length ? vals[vals.length - 1] : null;
    const score = last ? Number(last.value?.[0] ?? 0) : null;
    
    console.log(`✅ 关键词 "${testKeyword}" 的搜索趋势:`);
    console.log(`  数据点数量: ${vals.length}`);
    console.log(`  最新分数: ${score}`);
    console.log(`  时间范围: ${startTime.toISOString()} - ${new Date().toISOString()}`);
    
    // 4. 测试数据插入
    console.log('💾 测试数据插入...');
    const rank = score ? Math.max(1, Math.min(100, Math.round(100 - (score / 100) * 99))) : null;
    
    await client.query(
      `insert into trend_raw
        (source_id, country, category_key, window_period, keyword, rank, raw_score, meta_json, collected_at)
       values
        ($1,$2,$3,$4,$5,$6,$7,$8::jsonb, now())
       on conflict do nothing`,
      [
        "google_trends",
        TEST_CONFIG.country,
        TEST_CONFIG.category_key,
        TEST_CONFIG.window_period,
        testKeyword,
        rank,
        score,
        JSON.stringify({ 
          from: "google_trends_api_test",
          method: "interest_over_time",
          data_points: vals.length,
          time_range: {
            start: startTime.toISOString(),
            end: new Date().toISOString()
          },
          geo: TEST_CONFIG.country,
          category: TEST_CONFIG.category_key
        }),
      ]
    );
    
    console.log('✅ 测试数据插入成功');
    
    // 5. 验证数据
    console.log('🔍 验证插入的数据...');
    const result = await client.query(
      `SELECT * FROM trend_raw 
       WHERE source_id = 'google_trends' 
       AND keyword = $1 
       ORDER BY collected_at DESC 
       LIMIT 1`,
      [testKeyword]
    );
    
    if (result.rows.length > 0) {
      const row = result.rows[0];
      console.log('✅ 数据验证成功:');
      console.log(`  关键词: ${row.keyword}`);
      console.log(`  分数: ${row.raw_score}`);
      console.log(`  排名: ${row.rank}`);
      console.log(`  采集时间: ${row.collected_at}`);
    } else {
      console.log('❌ 未找到插入的数据');
    }
    
    await client.end();
    console.log('🎉 Google Trends API 测试完成！');
    
  } catch (error: any) {
    console.error('❌ 测试失败:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  testGoogleTrendsAPI();
}

export default testGoogleTrendsAPI;
