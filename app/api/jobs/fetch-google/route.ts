import { NextResponse } from "next/server";

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

// 根据类目获取相关关键词
function getCategoryKeywords(category_key: string, country: string): string[] {
  const baseKeywords = {
    'tech_electronics': [
      'iPhone', 'Samsung', 'Google', 'Apple', 'Microsoft', 'Tesla', 'AI', 'ChatGPT', 'Machine Learning',
      'Smartphone', 'Laptop', 'Computer', 'Software', 'Hardware', 'Internet', 'Cloud', 'Data',
      'Artificial Intelligence', 'Robotics', 'Automation', 'Blockchain', 'Cryptocurrency', 'Bitcoin',
      'Virtual Reality', 'Augmented Reality', '5G', 'WiFi', 'Bluetooth', 'USB', 'Battery', 'Charger'
    ],
    'vehicle_transportation': [
      'Tesla', 'BMW', 'Mercedes', 'Audi', 'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai',
      'Electric Car', 'Hybrid Car', 'SUV', 'Sedan', 'Truck', 'Motorcycle', 'Bicycle', 'Scooter',
      'Car Insurance', 'Car Loan', 'Car Rental', 'Gas Station', 'Electric Vehicle', 'Autonomous Car',
      'Car Maintenance', 'Car Repair', 'Car Wash', 'Parking', 'Traffic', 'Highway', 'Road Trip'
    ],
    'sports_outdoor': [
      'Nike', 'Adidas', 'Under Armour', 'Puma', 'New Balance', 'Reebok', 'Converse', 'Vans',
      'Running', 'Basketball', 'Football', 'Soccer', 'Tennis', 'Golf', 'Baseball', 'Hockey',
      'Swimming', 'Cycling', 'Hiking', 'Camping', 'Fishing', 'Surfing', 'Snowboarding', 'Skiing',
      'Gym', 'Workout', 'Fitness', 'Yoga', 'Pilates', 'CrossFit', 'Marathon', 'Triathlon',
      'Olympics', 'World Cup', 'Championship', 'Tournament', 'Training', 'Exercise', 'Sports'
    ],
    'pets': [
      'Dogs', 'Cats', 'Puppies', 'Kittens', 'Pet Care', 'Pet Training', 'Pet Grooming',
      'Pet Food', 'Pet Toys', 'Pet Accessories', 'Pet Health', 'Veterinary', 'Pet Adoption',
      'Pet Rescue', 'Pet Insurance', 'Pet Sitting', 'Pet Walking', 'Pet Boarding',
      'Dog Breeds', 'Cat Breeds', 'Golden Retriever', 'Labrador', 'German Shepherd', 'French Bulldog',
      'Poodle', 'Beagle', 'Rottweiler', 'Siberian Husky', 'Border Collie', 'Chihuahua',
      'Persian Cat', 'Maine Coon', 'British Shorthair', 'Ragdoll', 'Siamese', 'Sphynx'
    ],
    'household_products': [
      'Cleaning Supplies', 'Laundry Detergent', 'Dish Soap', 'All Purpose Cleaner', 'Glass Cleaner',
      'Floor Cleaner', 'Bathroom Cleaner', 'Kitchen Cleaner', 'Disinfectant', 'Sanitizer',
      'Paper Towels', 'Toilet Paper', 'Tissues', 'Napkins', 'Trash Bags', 'Storage Bags',
      'Kitchen Utensils', 'Cooking Tools', 'Baking Supplies', 'Measuring Cups', 'Measuring Spoons',
      'Mixing Bowls', 'Cutting Boards', 'Knives', 'Can Opener', 'Bottle Opener', 'Peeler',
      'Kitchen Appliances', 'Blender', 'Food Processor', 'Mixer', 'Toaster', 'Coffee Maker',
      'Microwave', 'Oven', 'Stove', 'Refrigerator', 'Dishwasher', 'Washing Machine', 'Dryer'
    ],
    'fashion_beauty': [
      'Nike', 'Adidas', 'Gucci', 'Louis Vuitton', 'Chanel', 'Hermès', 'Prada', 'Versace',
      'Balenciaga', 'Off-White', 'Supreme', 'Yeezy', 'Jordan', 'Converse', 'Vans', 'New Balance',
      'Fashion', 'Beauty', 'Makeup', 'Skincare', 'Hair Care', 'Perfume', 'Cosmetics',
      'Clothing', 'Shoes', 'Bags', 'Jewelry', 'Accessories', 'Style', 'Trend', 'Designer'
    ],
    'food_beverage': [
      'Starbucks', 'McDonald\'s', 'KFC', 'Pizza Hut', 'Subway', 'Burger King', 'Taco Bell',
      'Domino\'s', 'Papa John\'s', 'Chipotle', 'Panera Bread', 'Dunkin\'', 'Tim Hortons',
      'Coffee', 'Tea', 'Soda', 'Juice', 'Water', 'Beer', 'Wine', 'Cocktail', 'Food',
      'Restaurant', 'Cooking', 'Recipe', 'Dining', 'Delivery', 'Takeout', 'Fast Food'
    ]
  };
  
  const keywords = baseKeywords[category_key as keyof typeof baseKeywords] || baseKeywords['tech_electronics'];
  
  // 根据国家调整关键词
  return keywords.map(keyword => {
    if (country === 'US') return keyword;
    if (country === 'GB') return `${keyword} UK`;
    if (country === 'FR') return `${keyword} France`;
    if (country === 'DE') return `${keyword} Germany`;
    if (country === 'JP') return `${keyword} Japan`;
    return keyword;
  });
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
    const gtrends = await import("google-trends-api");
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
    
    // 1. 获取trending searches
    try {
      const trending = await gtrends.trendingSearches({ geo: country });
      const obj = JSON.parse(trending);
      const arr = obj?.default?.trendingSearchesDays?.[0]?.trendingSearches ?? [];
      for (const it of arr) {
        const kw = it?.title?.query;
        if (kw && typeof kw === "string") items.push(kw.trim());
      }
    } catch (e) {
      console.log('Failed to get trending searches:', e);
    }
    
    // 2. 根据类目添加相关关键词
    const categoryKeywords = getCategoryKeywords(category_key, country);
    items.push(...categoryKeywords);
    
    // 去重并限制数量
    const uniqueItems = Array.from(new Set(items)).slice(0, 50);

    const now = Date.now();
    const spanMs = window_period === "30d" ? 30 * 24 * 3600 * 1000 : window_period === "1d" ? 24 * 3600 * 1000 : 7 * 24 * 3600 * 1000;
    const startTime = new Date(now - spanMs);

    let ok = 0, fail = 0;
    for (const kw of uniqueItems) {
      try {
        const res = await gtrends.interestOverTime({
          keyword: kw,
          startTime,
          endTime: new Date(),
          geo: country,
        });
        const j = JSON.parse(res);
        const vals = j?.default?.timelineData ?? [];
        const last = vals.length ? vals[vals.length - 1] : null;
        const score = last ? Number(last.value?.[0] ?? 0) : null;

        // 计算排名（基于分数）
        const rank = score ? Math.max(1, Math.min(100, Math.round(100 - (score / 100) * 99))) : null;
        
        await client.query(
          `insert into trend_raw
            (source_id, country, category_key, window_period, keyword, rank, raw_score, meta_json, collected_at)
           values
            ($1,$2,$3,$4,$5,$6,$7,$8::jsonb, now())
           on conflict do nothing`,
          [
            "google_trends",
            country,
            category_key,
            window_period,
            kw,
            rank,
            score,
            JSON.stringify({ 
              from: "google_trends_api",
              method: "interest_over_time",
              data_points: vals.length,
              time_range: {
                start: startTime.toISOString(),
                end: new Date().toISOString()
              },
              geo: country,
              category: category_key
            }),
          ]
        );
        ok++;
      } catch {
        fail++;
      }
    }

    await client.end();
    return NextResponse.json({ 
      ok: true, 
      trendsCount: ok,
      message: `成功采集 ${ok} 条Google Trends数据`,
      inserted: ok, 
      failed: fail, 
      country, 
      window_period, 
      category_key,
      total_keywords: uniqueItems.length,
      note: "使用Google Trends API采集真实搜索趋势数据"
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
