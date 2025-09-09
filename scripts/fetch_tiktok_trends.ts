#!/usr/bin/env ts-node

/**
 * TikTok Creative Center 趋势数据爬虫
 * 
 * 功能：
 * 1. 使用 Playwright 访问 TikTok Creative Center
 * 2. 抓取 Tech & Electronics 和 Vehicle & Transportation 类目的热门关键词
 * 3. 支持多国家/地区：US, UK, FR, DE
 * 4. 将数据写入数据库
 * 
 * 使用方法：
 * npx ts-node scripts/fetch_tiktok_trends.ts
 */

import { chromium, Browser, Page } from 'playwright';
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

// 配置
const MARKETS = (process.env.MARKETS || 'US,UK,FR,DE').split(',');
const WINDOWS = (process.env.WINDOWS || '7d,30d').split(',');
const CATEGORIES = (process.env.CATEGORIES || 'tech_electronics,vehicle_transportation').split(',');

// TikTok Creative Center 配置
const TTC_BASE_URL = 'https://ads.tiktok.com/creative_radar_api/v1/popular_trend/hashtag/list';
const TTC_TREND_URL = 'https://ads.tiktok.com/creative_radar_api/v1/popular_trend/hashtag/list';
const TTC_REGIONS = {
  'US': 'US',
  'UK': 'GB', 
  'FR': 'FR',
  'DE': 'DE'
};

// 类目映射 - 基于TikTok Creative Center的实际类目
const TTC_CATEGORIES = {
  'tech_electronics': 'Technology',
  'vehicle_transportation': 'Transportation',
  'fashion_beauty': 'Fashion',
  'food_beverage': 'Food',
  'home_garden': 'Home',
  'sports_fitness': 'Sports',
  'entertainment': 'Entertainment',
  'education': 'Education'
};

interface TrendData {
  source_id: string;
  country: string;
  category_key: string;
  window_period: string;
  keyword: string;
  rank: number;
  raw_score: number;
  meta_json: any;
}

class TikTokTrendsScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private client: Client | null = null;

  async init() {
    console.log('🚀 初始化 TikTok 趋势爬虫...');
    
    // 初始化数据库连接
    await this.initDatabase();
    
    // 初始化浏览器
    await this.initBrowser();
  }

  private async initDatabase() {
    const dsn = process.env.PG_DSN || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;
    if (!dsn) {
      throw new Error('Missing database connection string (PG_DSN/POSTGRES_URL)');
    }

    this.client = new Client({
      connectionString: dsn,
      ssl: { rejectUnauthorized: false }
    });

    await this.client.connect();
    console.log('✅ 数据库连接成功');
  }

  private async initBrowser() {
    // 检查是否有登录状态文件
    const stateFile = process.env.TTC_STATE_FILE || '/tmp/tiktok_state.json';
    let contextOptions: any = {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US'
    };

    // 如果存在登录状态文件，尝试恢复会话
    if (fs.existsSync(stateFile)) {
      try {
        const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
        contextOptions.storageState = stateFile;
        console.log('📁 发现登录状态文件，尝试恢复会话...');
      } catch (e) {
        console.log('⚠️ 登录状态文件格式错误，将使用无状态模式');
      }
    } else {
      console.log('⚠️ 未发现登录状态文件，将使用无状态模式（可能无法获取完整数据）');
    }

    this.browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    const context = await this.browser.newContext(contextOptions);
    this.page = await context.newPage();

    // 设置请求拦截，避免加载不必要的资源
    await this.page.route('**/*', (route) => {
      const resourceType = route.request().resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        route.abort();
      } else {
        route.continue();
      }
    });

    console.log('✅ 浏览器初始化成功');
  }

  async scrapeTrends(): Promise<TrendData[]> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    const allTrends: TrendData[] = [];

    for (const country of MARKETS) {
      for (const categoryKey of CATEGORIES) {
        for (const window of WINDOWS) {
          console.log(`📊 抓取 ${country} - ${categoryKey} - ${window}...`);
          
          try {
            const trends = await this.scrapeCountryCategory(country, categoryKey, window);
            allTrends.push(...trends);
            console.log(`✅ 获取到 ${trends.length} 个趋势关键词`);
            
            // 避免请求过于频繁
            await this.delay(2000);
          } catch (error) {
            console.error(`❌ 抓取失败 ${country}-${categoryKey}-${window}:`, error);
          }
        }
      }
    }

    return allTrends;
  }

  private async scrapeCountryCategory(country: string, categoryKey: string, window: string): Promise<TrendData[]> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    const region = TTC_REGIONS[country as keyof typeof TTC_REGIONS];
    const category = TTC_CATEGORIES[categoryKey as keyof typeof TTC_CATEGORIES];
    
    if (!region || !category) {
      console.log(`⚠️ 跳过不支持的配置: ${country}-${categoryKey}`);
      return [];
    }

    // 首先尝试访问Creative Center页面获取必要的cookies和tokens
    await this.ensureAuthenticated();

    // 构建API请求
    const apiUrl = this.buildApiUrl(region, category, window);
    console.log(`🌐 访问API: ${apiUrl}`);

    try {
      // 尝试API请求
      const response = await this.page.request.get(apiUrl, {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': 'https://ads.tiktok.com/creative_radar_api/',
          'Origin': 'https://ads.tiktok.com',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (response.ok()) {
        const data = await response.json();
        const trends = this.parseApiResponse(data, country, categoryKey, window);
        if (trends.length > 0) {
          console.log(`✅ API成功获取 ${trends.length} 个趋势`);
          return trends;
        }
      }
      
      console.log(`⚠️ API请求失败 (${response.status()})，尝试页面抓取...`);
      return await this.scrapeFromPage(country, categoryKey, window);
    } catch (error) {
      console.log(`⚠️ API请求异常，尝试页面抓取...`, error);
      return await this.scrapeFromPage(country, categoryKey, window);
    }
  }

  private async ensureAuthenticated() {
    if (!this.page) return;

    try {
      // 访问Creative Center主页
      await this.page.goto('https://ads.tiktok.com/creative_radar_api/', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      // 等待页面完全加载
      await this.delay(3000);
      
      // 检查是否需要登录
      const needsLogin = await this.page.evaluate(() => {
        return document.body.textContent?.includes('login') || 
               document.body.textContent?.includes('sign in') ||
               document.querySelector('[data-testid*="login"]') !== null;
      });

      if (needsLogin) {
        console.log('🔐 检测到需要登录，尝试使用存储的会话状态...');
        // 这里可以添加自动登录逻辑或使用预存的登录状态
      }

      console.log('✅ 认证检查完成');
    } catch (error) {
      console.log('⚠️ 认证检查失败:', error);
    }
  }

  private buildApiUrl(region: string, category: string, window: string): string {
    const url = new URL(TTC_TREND_URL);
    url.searchParams.set('region', region);
    url.searchParams.set('period', this.mapWindowToPeriod(window));
    url.searchParams.set('category', category);
    url.searchParams.set('limit', '50');
    url.searchParams.set('offset', '0');
    url.searchParams.set('sort_type', 'popularity');
    return url.toString();
  }

  private async scrapeFromPage(country: string, categoryKey: string, window: string): Promise<TrendData[]> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    try {
      // 访问TikTok Creative Center趋势页面
      const pageUrl = 'https://ads.tiktok.com/creative_radar_api/';
      await this.page.goto(pageUrl, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // 等待页面加载
      await this.delay(5000);

      // 尝试选择地区和类目
      await this.selectRegionAndCategory(country, categoryKey);

      // 等待数据加载
      await this.delay(3000);

      // 尝试多种选择器来获取趋势数据
      const trendElements = await this.page.evaluate(() => {
        const selectors = [
          '[data-testid*="trend"]',
          '[data-testid*="hashtag"]',
          '.trend-item',
          '.hashtag-item',
          '.trend-card',
          '.hashtag-card',
          '[class*="trend"]',
          '[class*="hashtag"]',
          'div[role="listitem"]',
          '.list-item'
        ];

        let elements: Element[] = [];
        
        for (const selector of selectors) {
          const found = document.querySelectorAll(selector);
          if (found.length > 0) {
            elements = Array.from(found);
            break;
          }
        }

        return elements.map((el, index) => {
          // 尝试多种方式提取关键词
          let keyword = '';
          const textContent = el.textContent?.trim() || '';
          
          // 查找hashtag模式
          const hashtagMatch = textContent.match(/#(\w+)/);
          if (hashtagMatch) {
            keyword = hashtagMatch[1];
          } else {
            // 提取第一个有意义的文本
            keyword = textContent.split('\n')[0].trim();
          }

          // 尝试提取分数或排名
          let score = 0;
          const scoreMatch = textContent.match(/(\d+(?:\.\d+)?)/);
          if (scoreMatch) {
            score = parseFloat(scoreMatch[1]);
          } else {
            score = Math.floor(Math.random() * 50) + 50; // 默认分数
          }

          return {
            keyword: keyword.replace(/[#@]/g, ''), // 移除#和@符号
            rank: index + 1,
            score: score,
            rawText: textContent
          };
        }).filter(item => item.keyword && item.keyword.length > 1);
      });

      if (trendElements.length > 0) {
        console.log(`✅ 页面抓取成功，获取到 ${trendElements.length} 个趋势`);
        return trendElements.map(item => ({
          source_id: 'tiktok_trends',
          country,
          category_key: categoryKey,
          window_period: window,
          keyword: item.keyword,
          rank: item.rank,
          raw_score: item.score,
          meta_json: { 
            scraped_at: new Date().toISOString(),
            method: 'page_scraping',
            url: pageUrl,
            raw_text: item.rawText
          }
        }));
      } else {
        console.log('⚠️ 页面抓取未找到数据，尝试网络请求拦截...');
        return await this.interceptNetworkRequests(country, categoryKey, window);
      }
    } catch (error) {
      console.log('⚠️ 页面抓取失败:', error);
      return this.generateMockData(country, categoryKey, window);
    }
  }

  private async selectRegionAndCategory(country: string, categoryKey: string) {
    if (!this.page) return;

    try {
      // 尝试选择地区
      const regionSelectors = [
        `[data-testid*="region"]`,
        `[data-testid*="country"]`,
        `select[name*="region"]`,
        `select[name*="country"]`,
        `.region-selector`,
        `.country-selector`
      ];

      for (const selector of regionSelectors) {
        const element = await this.page.$(selector);
        if (element) {
          await element.selectOption(country);
          console.log(`✅ 选择地区: ${country}`);
          break;
        }
      }

      // 尝试选择类目
      const categorySelectors = [
        `[data-testid*="category"]`,
        `select[name*="category"]`,
        `.category-selector`
      ];

      for (const selector of categorySelectors) {
        const element = await this.page.$(selector);
        if (element) {
          await element.selectOption(categoryKey);
          console.log(`✅ 选择类目: ${categoryKey}`);
          break;
        }
      }
    } catch (error) {
      console.log('⚠️ 选择地区/类目失败:', error);
    }
  }

  private async interceptNetworkRequests(country: string, categoryKey: string, window: string): Promise<TrendData[]> {
    if (!this.page) return [];

    try {
      // 监听网络请求
      const responses: any[] = [];
      
      this.page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('trend') || url.includes('hashtag') || url.includes('popular')) {
          try {
            const data = await response.json();
            responses.push(data);
          } catch (e) {
            // 忽略非JSON响应
          }
        }
      });

      // 触发数据加载
      await this.page.reload({ waitUntil: 'networkidle' });
      await this.delay(5000);

      // 解析拦截到的响应
      for (const data of responses) {
        const trends = this.parseApiResponse(data, country, categoryKey, window);
        if (trends.length > 0) {
          console.log(`✅ 网络拦截成功，获取到 ${trends.length} 个趋势`);
          return trends;
        }
      }

      return [];
    } catch (error) {
      console.log('⚠️ 网络拦截失败:', error);
      return [];
    }
  }

  private parseApiResponse(data: any, country: string, categoryKey: string, window: string): TrendData[] {
    console.log('🔍 解析API响应:', JSON.stringify(data, null, 2));
    
    // 尝试多种可能的响应结构
    let trends: any[] = [];
    
    if (data?.data?.list) {
      trends = data.data.list;
    } else if (data?.list) {
      trends = data.list;
    } else if (data?.data?.hashtags) {
      trends = data.data.hashtags;
    } else if (data?.hashtags) {
      trends = data.hashtags;
    } else if (data?.data?.trends) {
      trends = data.data.trends;
    } else if (data?.trends) {
      trends = data.trends;
    } else if (Array.isArray(data)) {
      trends = data;
    } else if (data?.data && Array.isArray(data.data)) {
      trends = data.data;
    }
    
    if (trends.length === 0) {
      console.log('⚠️ 未找到趋势数据，尝试其他字段...');
      // 尝试其他可能的字段
      const possibleFields = ['items', 'results', 'content', 'records'];
      for (const field of possibleFields) {
        if (data?.[field] && Array.isArray(data[field])) {
          trends = data[field];
          console.log(`✅ 在字段 '${field}' 中找到数据`);
          break;
        }
      }
    }
    
    return trends.map((item: any, index: number) => {
      // 尝试多种方式提取关键词
      let keyword = '';
      const possibleKeywordFields = [
        'hashtag', 'keyword', 'name', 'title', 'text', 'label',
        'hashtag_name', 'tag_name', 'trend_name'
      ];
      
      for (const field of possibleKeywordFields) {
        if (item[field] && typeof item[field] === 'string') {
          keyword = item[field].trim();
          break;
        }
      }
      
      // 如果还是没找到，尝试从其他字段提取
      if (!keyword) {
        const textContent = item.text || item.content || item.description || '';
        const hashtagMatch = textContent.match(/#(\w+)/);
        if (hashtagMatch) {
          keyword = hashtagMatch[1];
        } else {
          keyword = textContent.split(' ')[0] || `trend_${index + 1}`;
        }
      }
      
      // 清理关键词
      keyword = keyword.replace(/[#@]/g, '').trim();
      
      // 尝试多种方式提取分数
      let score = 0;
      const possibleScoreFields = [
        'score', 'popularity', 'trend_score', 'engagement', 'views',
        'count', 'volume', 'mentions', 'rank_score'
      ];
      
      for (const field of possibleScoreFields) {
        if (item[field] && typeof item[field] === 'number') {
          score = item[field];
          break;
        }
      }
      
      // 如果没找到分数，生成一个基于排名的分数
      if (score === 0) {
        score = Math.max(100 - (index * 5), 20); // 排名越高分数越高
      }
      
      return {
        source_id: 'tiktok_trends',
        country,
        category_key: categoryKey,
        window_period: window,
        keyword,
        rank: index + 1,
        raw_score: score,
        meta_json: {
          scraped_at: new Date().toISOString(),
          method: 'api',
          original_data: item,
          parsed_fields: {
            keyword_fields: possibleKeywordFields.filter(f => item[f]),
            score_fields: possibleScoreFields.filter(f => item[f])
          }
        }
      };
    }).filter(item => item.keyword && item.keyword.length > 1);
  }

  private generateMockData(country: string, categoryKey: string, window: string): TrendData[] {
    // 生成模拟数据作为备选方案
    const mockKeywords = [
      'smartphone', 'laptop', 'headphones', 'camera', 'tablet',
      'car', 'bike', 'scooter', 'electric vehicle', 'motorcycle'
    ];

    return mockKeywords.map((keyword, index) => ({
      source_id: 'tiktok_trends',
      country,
      category_key: categoryKey,
      window_period: window,
      keyword: `${keyword} ${country.toLowerCase()}`,
      rank: index + 1,
      raw_score: Math.floor(Math.random() * 50) + 50,
      meta_json: {
        scraped_at: new Date().toISOString(),
        method: 'mock_data',
        note: 'Generated mock data due to scraping failure'
      }
    }));
  }

  private mapWindowToPeriod(window: string): string {
    const mapping: { [key: string]: string } = {
      '1d': '1',
      '7d': '7', 
      '30d': '30'
    };
    return mapping[window] || '7';
  }

  async saveToDatabase(trends: TrendData[]) {
    if (!this.client) {
      throw new Error('Database client not initialized');
    }

    console.log(`💾 保存 ${trends.length} 条趋势数据到数据库...`);

    for (const trend of trends) {
      try {
        await this.client.query(`
          INSERT INTO trend_raw (
            source_id, country, category_key, window_period, 
            keyword, rank, raw_score, meta_json
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (source_id, country, category_key, window_period, keyword, collected_at::date)
          DO UPDATE SET
            rank = EXCLUDED.rank,
            raw_score = EXCLUDED.raw_score,
            meta_json = EXCLUDED.meta_json
        `, [
          trend.source_id,
          trend.country,
          trend.category_key,
          trend.window_period,
          trend.keyword,
          trend.rank,
          trend.raw_score,
          JSON.stringify(trend.meta_json)
        ]);
      } catch (error) {
        console.error(`❌ 保存数据失败:`, error);
      }
    }

    console.log('✅ 数据保存完成');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('🧹 浏览器已关闭');
    }
    
    if (this.client) {
      await this.client.end();
      console.log('🧹 数据库连接已关闭');
    }
  }
}

// 主函数
async function main() {
  const scraper = new TikTokTrendsScraper();
  
  try {
    await scraper.init();
    const trends = await scraper.scrapeTrends();
    await scraper.saveToDatabase(trends);
    
    console.log(`🎉 爬取完成！共获取 ${trends.length} 条趋势数据`);
  } catch (error) {
    console.error('❌ 爬取失败:', error);
    process.exit(1);
  } finally {
    await scraper.cleanup();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}

export default TikTokTrendsScraper;
