import { NextResponse } from "next/server";
import { getCategoryById, getCategoryByName } from "@/lib/google-trends-categories";

// Vercel/Next
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Google Trends 国家代码映射
const SUPPORTED = new Set(["US", "UK", "GB", "FR", "DE", "JP"]);
const COUNTRY_ALIAS: Record<string, string> = { UK: "GB" };

const REGION_MAP: Record<string, { gt: string; ttc: string }> = {
  US: { gt: "US", ttc: "US" },
  GB: { gt: "GB", ttc: "GB" },
  FR: { gt: "FR", ttc: "FR" },
  DE: { gt: "DE", ttc: "DE" },
  JP: { gt: "JP", ttc: "JP" },
};

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
  const category_key = url.searchParams.get("category_key") || "shopping";
  const window_period = url.searchParams.get("window_period") || "7d";

  if (!SUPPORTED.has(country)) {
    return NextResponse.json({ ok: false, error: `country not supported: ${countryRaw}` }, { status: 400 });
  }

  const dsn = process.env.PG_DSN_POOL || process.env.PG_DSN || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;
  if (!dsn) return NextResponse.json({ ok: false, error: "Missing PG DSN" }, { status: 500 });

  try {
    // 动态导入真实的Google Trends抓取器
    const { fetchRealGoogleTrends } = await import("../../../scripts/fetch_google_trends_real");
    
    const mod = await import("pg");
    const { Client } = (mod as any).default || (mod as any);

    const client = new Client({ connectionString: dsn, ssl: { rejectUnauthorized: false } });
    await client.connect();

    const region = REGION_MAP[country] || { gt: country, ttc: country };
    
    // 确保基础数据存在
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

    // 获取关键词列表
    const keywords = getGoogleTrendsKeywords(category_key, country);
    const uniqueKeywords = Array.from(new Set(keywords)).slice(0, 20); // 限制数量避免超时
    
    console.log(`Starting real Google Trends scraping for ${uniqueKeywords.length} keywords`);

    // 调用真实的Google Trends抓取器
    const result = await fetchRealGoogleTrends(uniqueKeywords, country, category_key, window_period);

    await client.end();
    
    return NextResponse.json({ 
      ok: true, 
      trendsCount: result.successCount,
      message: result.message,
      inserted: result.successCount, 
      failed: result.failCount, 
      country, 
      window_period, 
      category_key,
      total_keywords: uniqueKeywords.length,
      note: "使用Puppeteer抓取真实Google Trends数据，包含相关主题和查询"
    });
  } catch (e: any) {
    console.error('Real Google Trends scraping failed:', e);
    return NextResponse.json({ 
      ok: false, 
      error: String(e?.message || e),
      fallback: "真实数据抓取失败，可以尝试使用模拟数据API"
    }, { status: 500 });
  }
}
