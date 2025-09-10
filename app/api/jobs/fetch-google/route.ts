import { NextResponse } from "next/server";
import { getCategoryById, getCategoryByName } from "@/lib/google-trends-categories";

// Vercel/Next
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Google Trends 国家代码映射（google-trends-api 用的是 "US"/"GB"/"FR"/"DE"/"JP" 这类）
const SUPPORTED = new Set(["US", "UK", "GB", "FR", "DE", "JP"]);
const COUNTRY_ALIAS: Record<string, string> = { UK: "GB" };

const REGION_MAP: Record<string, { gt: string; ttc: string }> = {
  US: { gt: "US", ttc: "US" },
  GB: { gt: "GB", ttc: "GB" },
  FR: { gt: "FR", ttc: "FR" },
  DE: { gt: "DE", ttc: "DE" },
  JP: { gt: "JP", ttc: "JP" },
};

// 生成相关搜索主题
function generateRelatedTopics(keyword: string, random: number): Array<{topic: string, rise: number}> {
  const topicMap: Record<string, string[]> = {
    'shopping': ['在线购物', '电商平台', '购物网站', '零售业', '消费者行为'],
    'online shopping': ['电商', '网购', '购物平台', '数字零售', '消费者趋势'],
    'ecommerce': ['电子商务', '在线销售', '数字商务', '电商平台', '网络零售'],
    'retail': ['零售业', '实体店', '购物中心', '零售趋势', '消费者市场'],
    'store': ['商店', '零售店', '购物场所', '实体零售', '店铺管理'],
    'buy': ['购买', '消费', '购物决策', '购买行为', '消费者心理'],
    'purchase': ['采购', '购买流程', '消费决策', '购买力', '市场购买'],
    'deal': ['优惠', '促销', '折扣', '特价', '优惠活动'],
    'sale': ['销售', '促销活动', '特价销售', '销售趋势', '市场销售'],
    'discount': ['折扣', '优惠券', '降价', '特价', '促销折扣']
  };
  
  const topics = topicMap[keyword.toLowerCase()] || ['相关主题1', '相关主题2', '相关主题3', '相关主题4', '相关主题5'];
  const riseValues = [70, 50, 40, 30, 20];
  
  return topics.slice(0, 5).map((topic, index) => ({
    topic,
    rise: riseValues[index] + Math.floor((random - 0.5) * 20)
  }));
}

// 生成相关搜索查询
function generateRelatedQueries(keyword: string, random: number): Array<{query: string, rise: number}> {
  const queryMap: Record<string, string[]> = {
    'shopping': ['best online shopping sites', 'shopping deals today', 'online shopping tips', 'shopping apps', 'shopping trends 2024'],
    'online shopping': ['online shopping safety', 'best online stores', 'online shopping comparison', 'online shopping reviews', 'online shopping guide'],
    'ecommerce': ['ecommerce platforms', 'ecommerce trends', 'ecommerce solutions', 'ecommerce marketing', 'ecommerce analytics'],
    'retail': ['retail industry trends', 'retail technology', 'retail management', 'retail analytics', 'retail innovation'],
    'store': ['store locator', 'store hours', 'store management', 'store design', 'store operations'],
    'buy': ['buy online', 'buy now pay later', 'buying guide', 'buying tips', 'buying decisions'],
    'purchase': ['purchase order', 'purchase history', 'purchase protection', 'purchase planning', 'purchase analysis'],
    'deal': ['deal alerts', 'deal websites', 'deal finder', 'deal tracker', 'deal comparison'],
    'sale': ['sale events', 'sale calendar', 'sale notifications', 'sale trends', 'sale analytics'],
    'discount': ['discount codes', 'discount websites', 'discount apps', 'discount finder', 'discount alerts']
  };
  
  const queries = queryMap[keyword.toLowerCase()] || [
    `${keyword} guide`, `${keyword} tips`, `${keyword} trends`, `${keyword} reviews`, `${keyword} comparison`
  ];
  const riseValues = [1050, 1000, 300, 200, 170];
  
  return queries.slice(0, 5).map((query, index) => ({
    query,
    rise: riseValues[index] + Math.floor((random - 0.5) * 200)
  }));
}

// 根据Google Trends分类获取相关关键词
function getGoogleTrendsKeywords(category_key: string, country: string): string[] {
  // 获取分类信息
  const category = getCategoryByName(category_key);
  if (!category) {
    console.log(`Unknown category: ${category_key}`);
    return [];
  }

  // 根据分类ID生成相关关键词
  const categoryKeywords: Record<number, string[]> = {
    // 购物相关
    23: ['shopping', 'online shopping', 'ecommerce', 'retail', 'store', 'buy', 'purchase', 'deal', 'sale', 'discount'],
    // 计算机与电子产品
    6: ['computer', 'laptop', 'smartphone', 'tablet', 'software', 'hardware', 'internet', 'technology', 'digital', 'electronic'],
    // 汽车与交通工具
    2: ['car', 'vehicle', 'automobile', 'truck', 'motorcycle', 'bicycle', 'transportation', 'driving', 'road', 'highway'],
    // 健康
    10: ['health', 'medical', 'fitness', 'wellness', 'doctor', 'hospital', 'medicine', 'treatment', 'therapy', 'nutrition'],
    // 体育
    25: ['sports', 'football', 'basketball', 'soccer', 'tennis', 'golf', 'baseball', 'hockey', 'olympics', 'athletics'],
    // 旅行
    26: ['travel', 'trip', 'vacation', 'hotel', 'flight', 'booking', 'destination', 'tourism', 'adventure', 'holiday'],
    // 美食与饮料
    8: ['food', 'restaurant', 'cooking', 'recipe', 'dining', 'beverage', 'drink', 'meal', 'cuisine', 'kitchen'],
    // 美容与健身
    3: ['beauty', 'makeup', 'skincare', 'fitness', 'gym', 'workout', 'cosmetics', 'hair', 'nail', 'fashion'],
    // 家居与园艺
    12: ['home', 'house', 'furniture', 'garden', 'decor', 'appliance', 'kitchen', 'bedroom', 'living room', 'outdoor'],
    // 宠物与动物
    19: ['pet', 'dog', 'cat', 'animal', 'veterinary', 'pet care', 'pet food', 'pet training', 'wildlife', 'zoo']
  };

  // 根据国家调整关键词
  const countryKeywords: Record<string, string[]> = {
    'US': ['USA', 'American', 'United States'],
    'GB': ['UK', 'British', 'London', 'Manchester', 'Birmingham'],
    'FR': ['France', 'French', 'Paris', 'Lyon', 'Marseille'],
    'DE': ['Germany', 'German', 'Berlin', 'Munich', 'Hamburg'],
    'JP': ['Japan', 'Japanese', 'Tokyo', 'Osaka', 'Kyoto']
  };

  const base = categoryKeywords[category.id] || [];
  const countrySpecific = countryKeywords[country] || [];
  
  return [...base, ...countrySpecific];
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}

async function handle(req: Request) {
  const url = new URL(req.url);
  const countryRaw = (url.searchParams.get("country") || "US").toUpperCase();
  const country = COUNTRY_ALIAS[countryRaw] || countryRaw;
  const category_key = url.searchParams.get("category_key") || "tech_electronics";
  const window_period = url.searchParams.get("window_period") || "7d";

  if (!SUPPORTED.has(country)) {
    return NextResponse.json({ ok: false, error: `country not supported: ${countryRaw}` }, { status: 400 });
  }

  const dsn = process.env.PG_DSN_POOL || process.env.PG_DSN || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;
  if (!dsn) return NextResponse.json({ ok: false, error: "Missing PG DSN" }, { status: 500 });

  try {
    // 使用CommonJS方式导入google-trends-api
    const gtrends = require("google-trends-api");
    console.log('gtrends module keys:', Object.keys(gtrends));
    
    // 根据实际的API结构使用正确的函数
    const trendingSearches = gtrends.hotTrends || gtrends.trendingSearches;
    const interestOverTime = gtrends.trendData || gtrends.interestOverTime;
    
    if (!trendingSearches || !interestOverTime) {
      console.error('Failed to import google-trends-api functions');
      console.error('Available functions:', Object.keys(gtrends));
      return NextResponse.json({ ok: false, error: "Failed to import google-trends-api" }, { status: 500 });
    }
    const mod = await import("pg");
    const { Client } = (mod as any).default || (mod as any);

    const client = new Client({ connectionString: dsn, ssl: { rejectUnauthorized: false } });
    await client.connect();

    const region = REGION_MAP[country] || { gt: country, ttc: country };
    await client.query(
      `insert into trend_source(source_id, display_name)
       values('google_trends','Google Trends')
       on conflict(source_id) do update set display_name=excluded.display_name`
    );
    await client.query(
      `insert into country_map(country, gt_geo, ttc_region)
       values($1,$2,$3)
       on conflict(country) do update set gt_geo=excluded.gt_geo, ttc_region=excluded.ttc_region`,
      [country, region.gt, region.ttc]
    );
    await client.query(
      `insert into trend_category_map(category_key)
       values($1) on conflict(category_key) do nothing`,
      [category_key]
    );

    // 获取Google Trends数据
    const items: string[] = [];
    
    // 1. 获取trending searches - 暂时跳过，因为API服务不稳定
    try {
      console.log(`Skipping trending searches for country: ${country} - API service unstable`);
      // const trending = await trendingSearches({ geo: country });
      // console.log('Trending searches response:', trending.substring(0, 500) + '...');
      
      // const obj = JSON.parse(trending);
      // const arr = obj?.default?.trendingSearchesDays?.[0]?.trendingSearches ?? [];
      // console.log(`Found ${arr.length} trending searches`);
      
      // for (const it of arr) {
      //   const kw = it?.title?.query;
      //   if (kw && typeof kw === "string") {
      //     items.push(kw.trim());
      //     console.log(`Added trending keyword: ${kw.trim()}`);
      //   }
      // }
    } catch (e) {
      console.error('Failed to get trending searches:', e);
    }
    
    // 2. 根据类目添加相关关键词
    const categoryKeywords = getGoogleTrendsKeywords(category_key, country);
    console.log(`Adding ${categoryKeywords.length} category keywords for ${category_key}`);
    items.push(...categoryKeywords);
    
    // 去重并限制数量
    const uniqueItems = Array.from(new Set(items)).slice(0, 50);
    console.log(`Total unique keywords to process: ${uniqueItems.length}`);

    const now = Date.now();
    const spanMs = window_period === "90d" ? 90 * 24 * 3600 * 1000 : 
                   window_period === "30d" ? 30 * 24 * 3600 * 1000 : 
                   window_period === "1d" ? 24 * 3600 * 1000 : 7 * 24 * 3600 * 1000;
    const startTime = new Date(now - spanMs);

    let ok = 0, fail = 0, skipped = 0;
    const errors: string[] = [];
    
    for (const kw of uniqueItems) {
      try {
        console.log(`Processing keyword: ${kw} for ${country}`);
        
        // 暂时使用模拟数据，因为google-trends-api库存在兼容性问题
        // TODO: 后续可以尝试其他Google Trends API库或直接调用Google Trends网页版
        let score = null;
        let rank = null;
        let dataPoints = 0;
        
        // 生成更接近真实Google Trends的模拟数据
        const seed = kw.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        const random = (seed * 9301 + 49297) % 233280 / 233280;
        
        // 根据关键词类型和流行度调整分数范围
        const keywordPopularity = {
          'shopping': 95, 'online shopping': 90, 'ecommerce': 85, 'retail': 80,
          'store': 75, 'buy': 70, 'purchase': 65, 'deal': 60, 'sale': 55,
          'discount': 50, 'usa': 45, 'american': 40, 'united states': 35
        };
        
        const baseScore = keywordPopularity[kw.toLowerCase() as keyof typeof keywordPopularity] || Math.floor(20 + (random * 60));
        
        // 添加一些随机波动，模拟真实趋势
        const fluctuation = Math.floor((random - 0.5) * 20); // -10 到 +10 的波动
        score = Math.max(0, Math.min(100, baseScore + fluctuation));
        
        // 更真实的排名计算（Google Trends通常显示相对热度）
        rank = Math.max(1, Math.min(100, Math.round(100 - (score / 100) * 99)));
        dataPoints = Math.floor(30 + (random * 40)); // 模拟30-70个数据点
        
        // 生成相关搜索主题
        const relatedTopics = generateRelatedTopics(kw, random);
        const relatedQueries = generateRelatedQueries(kw, random);
        
        console.log(`Generated mock data for "${kw}": score=${score}, rank=${rank}, dataPoints=${dataPoints}`);
        
        // 先删除已存在的记录，然后插入新记录
        await client.query(
          `delete from trend_raw 
           where source_id = $1 and country = $2 and category_key = $3 and window_period = $4 and keyword = $5`,
          ["google_trends", country, category_key, window_period, kw]
        );
        
        const result = await client.query(
          `insert into trend_raw
            (source_id, country, category_key, window_period, keyword, rank, raw_score, meta_json, collected_at)
           values
            ($1,$2,$3,$4,$5,$6,$7,$8::jsonb, now())
           returning id`,
          [
            "google_trends",
            country,
            category_key,
            window_period,
            kw,
            rank,
            score,
            JSON.stringify({ 
              from: "google_trends_mock",
              method: "simulated_data",
              data_points: dataPoints,
              time_range: {
                start: startTime.toISOString(),
                end: new Date().toISOString()
              },
              geo: country,
              category: category_key,
              keyword: kw,
              score: score,
              rank: rank,
              related_topics: relatedTopics,
              related_queries: relatedQueries,
              note: "使用改进的模拟数据，包含相关主题和查询，更接近真实Google Trends趋势"
            }),
          ]
        );
        
        if (result.rows.length > 0) {
          ok++;
          console.log(`Successfully inserted/updated "${kw}" with rank ${rank}, score ${score}`);
        } else {
          skipped++;
          console.log(`Skipped "${kw}" - no rows affected`);
        }
      } catch (e: any) {
        fail++;
        errors.push(`${kw}: ${e?.message || e}`);
        console.error(`Failed to process keyword "${kw}":`, e);
      }
    }

    await client.end();
    return NextResponse.json({ 
      ok: true, 
      trendsCount: ok,
      message: `成功采集 ${ok} 条Google Trends模拟数据 (跳过 ${skipped} 条, 失败 ${fail} 条)`,
      inserted: ok, 
      skipped: skipped,
      failed: fail, 
      country, 
      window_period, 
      category_key,
      total_keywords: uniqueItems.length,
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined, // 只返回前5个错误
      note: "使用改进的模拟数据，更接近真实Google Trends趋势。后续将集成真实的Google Trends数据源。"
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
