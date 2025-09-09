#!/usr/bin/env ts-node

/**
 * TikTok爬虫测试脚本
 * 用于测试真实的TikTok Creative Center爬虫功能
 */

import { TikTokTrendsScraper } from './fetch_tiktok_trends';

async function testTikTokScraper() {
  console.log('🧪 开始测试TikTok爬虫...');
  
  // 设置测试环境变量
  process.env.PG_DSN = process.env.PG_DSN_POOL || process.env.POSTGRES_URL;
  process.env.MARKETS = 'US';
  process.env.CATEGORIES = 'tech_electronics';
  process.env.WINDOWS = '7d';
  
  if (!process.env.PG_DSN) {
    console.error('❌ 缺少数据库连接字符串 (PG_DSN_POOL/POSTGRES_URL)');
    process.exit(1);
  }

  const scraper = new TikTokTrendsScraper();
  
  try {
    console.log('🚀 初始化爬虫...');
    await scraper.init();
    
    console.log('📊 开始爬取趋势数据...');
    const trends = await scraper.scrapeTrends();
    
    console.log(`✅ 爬取完成！获取到 ${trends.length} 条趋势数据`);
    
    if (trends.length > 0) {
      console.log('\n📋 前5条数据预览:');
      trends.slice(0, 5).forEach((trend, index) => {
        console.log(`${index + 1}. ${trend.keyword} (${trend.country}-${trend.category_key}-${trend.window_period}) - 得分: ${trend.raw_score}`);
      });
      
      console.log('\n💾 保存数据到数据库...');
      await scraper.saveToDatabase(trends);
      console.log('✅ 数据保存完成');
    } else {
      console.log('⚠️ 未获取到任何趋势数据');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  } finally {
    console.log('🧹 清理资源...');
    await scraper.cleanup();
  }
  
  console.log('🎉 测试完成！');
}

// 运行测试
if (require.main === module) {
  testTikTokScraper().catch(console.error);
}
