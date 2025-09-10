// Google Trends 官方分类结构
// 基于 Google Trends API 的完整分类体系

export interface GoogleTrendsCategory {
  id: number;
  name: string;
  displayName: string;
  children?: GoogleTrendsCategory[];
}

export const GOOGLE_TRENDS_CATEGORIES: GoogleTrendsCategory[] = [
  {
    id: 0,
    name: "all",
    displayName: "所有类别",
    children: [
      {
        id: 1,
        name: "arts_entertainment",
        displayName: "艺术与娱乐",
        children: [
          { id: 101, name: "books_literature", displayName: "图书与文学" },
          { id: 102, name: "comics_animation", displayName: "漫画与动画" },
          { id: 103, name: "movies", displayName: "电影" },
          { id: 104, name: "music", displayName: "音乐" },
          { id: 105, name: "television", displayName: "电视" },
          { id: 106, name: "visual_arts", displayName: "视觉艺术" }
        ]
      },
      {
        id: 2,
        name: "autos_vehicles",
        displayName: "汽车与交通工具",
        children: [
          { id: 201, name: "cars", displayName: "汽车" },
          { id: 202, name: "motorcycles", displayName: "摩托车" },
          { id: 203, name: "trucks", displayName: "卡车" },
          { id: 204, name: "boats", displayName: "船只" },
          { id: 205, name: "aircraft", displayName: "飞机" }
        ]
      },
      {
        id: 3,
        name: "beauty_fitness",
        displayName: "美容与健身",
        children: [
          { id: 301, name: "beauty", displayName: "美容" },
          { id: 302, name: "fitness", displayName: "健身" },
          { id: 303, name: "health", displayName: "健康" },
          { id: 304, name: "skincare", displayName: "护肤" },
          { id: 305, name: "makeup", displayName: "化妆" }
        ]
      },
      {
        id: 4,
        name: "books_literature",
        displayName: "图书与文学",
        children: [
          { id: 401, name: "fiction", displayName: "小说" },
          { id: 402, name: "non_fiction", displayName: "非小说" },
          { id: 403, name: "poetry", displayName: "诗歌" },
          { id: 404, name: "childrens_books", displayName: "儿童读物" }
        ]
      },
      {
        id: 5,
        name: "business_industrial",
        displayName: "商业与工业",
        children: [
          { id: 501, name: "advertising_marketing", displayName: "广告与营销" },
          { id: 502, name: "agriculture", displayName: "农业" },
          { id: 503, name: "automotive_industry", displayName: "汽车工业" },
          { id: 504, name: "chemicals", displayName: "化工" },
          { id: 505, name: "construction", displayName: "建筑" },
          { id: 506, name: "finance", displayName: "金融" },
          { id: 507, name: "food_industry", displayName: "食品工业" },
          { id: 508, name: "forestry", displayName: "林业" },
          { id: 509, name: "manufacturing", displayName: "制造业" },
          { id: 510, name: "metals_mining", displayName: "金属与采矿" },
          { id: 511, name: "real_estate", displayName: "房地产" },
          { id: 512, name: "retail", displayName: "零售" },
          { id: 513, name: "textiles", displayName: "纺织" },
          { id: 514, name: "transportation", displayName: "运输" }
        ]
      },
      {
        id: 6,
        name: "computers_electronics",
        displayName: "计算机与电子产品",
        children: [
          { id: 601, name: "computer_hardware", displayName: "计算机硬件" },
          { id: 602, name: "computer_software", displayName: "计算机软件" },
          { id: 603, name: "consumer_electronics", displayName: "消费电子产品" },
          { id: 604, name: "internet", displayName: "互联网" },
          { id: 605, name: "mobile_phones", displayName: "手机" },
          { id: 606, name: "programming", displayName: "编程" },
          { id: 607, name: "video_games", displayName: "视频游戏" },
          { id: 608, name: "web_services", displayName: "网络服务" }
        ]
      },
      {
        id: 7,
        name: "finance",
        displayName: "金融",
        children: [
          { id: 701, name: "banking", displayName: "银行业" },
          { id: 702, name: "credit", displayName: "信贷" },
          { id: 703, name: "insurance", displayName: "保险" },
          { id: 704, name: "investing", displayName: "投资" },
          { id: 705, name: "loans", displayName: "贷款" },
          { id: 706, name: "mortgages", displayName: "抵押贷款" },
          { id: 707, name: "taxes", displayName: "税务" }
        ]
      },
      {
        id: 8,
        name: "food_drink",
        displayName: "食品与饮料",
        children: [
          { id: 801, name: "beverages", displayName: "饮料" },
          { id: 802, name: "cooking", displayName: "烹饪" },
          { id: 803, name: "dining_out", displayName: "外出就餐" },
          { id: 804, name: "food", displayName: "食品" },
          { id: 805, name: "recipes", displayName: "食谱" },
          { id: 806, name: "restaurants", displayName: "餐厅" }
        ]
      },
      {
        id: 9,
        name: "games",
        displayName: "游戏",
        children: [
          { id: 901, name: "board_games", displayName: "桌游" },
          { id: 902, name: "card_games", displayName: "纸牌游戏" },
          { id: 903, name: "computer_games", displayName: "电脑游戏" },
          { id: 904, name: "console_games", displayName: "主机游戏" },
          { id: 905, name: "mobile_games", displayName: "手机游戏" },
          { id: 906, name: "online_games", displayName: "网络游戏" },
          { id: 907, name: "puzzle_games", displayName: "益智游戏" },
          { id: 908, name: "role_playing_games", displayName: "角色扮演游戏" },
          { id: 909, name: "sports_games", displayName: "体育游戏" },
          { id: 910, name: "strategy_games", displayName: "策略游戏" },
          { id: 911, name: "video_games", displayName: "视频游戏" }
        ]
      },
      {
        id: 10,
        name: "health",
        displayName: "健康",
        children: [
          { id: 1001, name: "alternative_medicine", displayName: "替代医学" },
          { id: 1002, name: "diseases_conditions", displayName: "疾病与症状" },
          { id: 1003, name: "fitness", displayName: "健身" },
          { id: 1004, name: "medical_devices", displayName: "医疗设备" },
          { id: 1005, name: "mental_health", displayName: "心理健康" },
          { id: 1006, name: "nutrition", displayName: "营养" },
          { id: 1007, name: "pharmaceuticals", displayName: "制药" },
          { id: 1008, name: "public_health", displayName: "公共卫生" },
          { id: 1009, name: "surgery", displayName: "外科" },
          { id: 1010, name: "veterinary_medicine", displayName: "兽医学" }
        ]
      },
      {
        id: 11,
        name: "hobbies_leisure",
        displayName: "爱好与休闲",
        children: [
          { id: 1101, name: "collecting", displayName: "收藏" },
          { id: 1102, name: "crafts", displayName: "手工艺" },
          { id: 1103, name: "gardening", displayName: "园艺" },
          { id: 1104, name: "hobbies", displayName: "爱好" },
          { id: 1105, name: "outdoor_activities", displayName: "户外活动" },
          { id: 1106, name: "photography", displayName: "摄影" },
          { id: 1107, name: "travel", displayName: "旅行" }
        ]
      },
      {
        id: 12,
        name: "home_garden",
        displayName: "家居与园艺",
        children: [
          { id: 1201, name: "appliances", displayName: "家电" },
          { id: 1202, name: "furniture", displayName: "家具" },
          { id: 1203, name: "gardening", displayName: "园艺" },
          { id: 1204, name: "home_decor", displayName: "家居装饰" },
          { id: 1205, name: "home_improvement", displayName: "家居装修" },
          { id: 1206, name: "household_supplies", displayName: "家居用品" },
          { id: 1207, name: "kitchen_dining", displayName: "厨房与餐厅" },
          { id: 1208, name: "lawn_garden", displayName: "草坪与花园" },
          { id: 1209, name: "pets", displayName: "宠物" }
        ]
      },
      {
        id: 13,
        name: "internet_telecom",
        displayName: "互联网与电信",
        children: [
          { id: 1301, name: "broadband", displayName: "宽带" },
          { id: 1302, name: "email", displayName: "电子邮件" },
          { id: 1303, name: "internet", displayName: "互联网" },
          { id: 1304, name: "mobile_phones", displayName: "手机" },
          { id: 1305, name: "telecommunications", displayName: "电信" },
          { id: 1306, name: "voip", displayName: "网络电话" },
          { id: 1307, name: "web_services", displayName: "网络服务" }
        ]
      },
      {
        id: 14,
        name: "jobs_education",
        displayName: "工作与教育",
        children: [
          { id: 1401, name: "careers", displayName: "职业" },
          { id: 1402, name: "education", displayName: "教育" },
          { id: 1403, name: "jobs", displayName: "工作" },
          { id: 1404, name: "training", displayName: "培训" },
          { id: 1405, name: "universities", displayName: "大学" }
        ]
      },
      {
        id: 15,
        name: "law_government",
        displayName: "法律与政府",
        children: [
          { id: 1501, name: "government", displayName: "政府" },
          { id: 1502, name: "law", displayName: "法律" },
          { id: 1503, name: "military", displayName: "军事" },
          { id: 1504, name: "politics", displayName: "政治" },
          { id: 1505, name: "public_safety", displayName: "公共安全" }
        ]
      },
      {
        id: 16,
        name: "news",
        displayName: "新闻",
        children: [
          { id: 1601, name: "breaking_news", displayName: "突发新闻" },
          { id: 1602, name: "business_news", displayName: "商业新闻" },
          { id: 1603, name: "entertainment_news", displayName: "娱乐新闻" },
          { id: 1604, name: "health_news", displayName: "健康新闻" },
          { id: 1605, name: "international_news", displayName: "国际新闻" },
          { id: 1606, name: "local_news", displayName: "本地新闻" },
          { id: 1607, name: "politics_news", displayName: "政治新闻" },
          { id: 1608, name: "sports_news", displayName: "体育新闻" },
          { id: 1609, name: "technology_news", displayName: "科技新闻" },
          { id: 1610, name: "weather", displayName: "天气" }
        ]
      },
      {
        id: 17,
        name: "online_communities",
        displayName: "在线社区",
        children: [
          { id: 1701, name: "forums", displayName: "论坛" },
          { id: 1702, name: "social_networking", displayName: "社交网络" },
          { id: 1703, name: "wikis", displayName: "维基" }
        ]
      },
      {
        id: 18,
        name: "people_society",
        displayName: "人与社会",
        children: [
          { id: 1801, name: "demographics", displayName: "人口统计" },
          { id: 1802, name: "ethnicity", displayName: "种族" },
          { id: 1803, name: "family", displayName: "家庭" },
          { id: 1804, name: "lifestyle", displayName: "生活方式" },
          { id: 1805, name: "relationships", displayName: "人际关系" },
          { id: 1806, name: "religion", displayName: "宗教" },
          { id: 1807, name: "social_issues", displayName: "社会问题" }
        ]
      },
      {
        id: 19,
        name: "pets_animals",
        displayName: "宠物与动物",
        children: [
          { id: 1901, name: "animals", displayName: "动物" },
          { id: 1902, name: "pets", displayName: "宠物" },
          { id: 1903, name: "wildlife", displayName: "野生动物" }
        ]
      },
      {
        id: 20,
        name: "real_estate",
        displayName: "房地产",
        children: [
          { id: 2001, name: "commercial_real_estate", displayName: "商业房地产" },
          { id: 2002, name: "home_buying", displayName: "购房" },
          { id: 2003, name: "home_selling", displayName: "售房" },
          { id: 2004, name: "rentals", displayName: "租赁" }
        ]
      },
      {
        id: 21,
        name: "reference",
        displayName: "参考资料",
        children: [
          { id: 2101, name: "dictionaries", displayName: "词典" },
          { id: 2102, name: "encyclopedias", displayName: "百科全书" },
          { id: 2103, name: "libraries", displayName: "图书馆" },
          { id: 2104, name: "maps", displayName: "地图" },
          { id: 2105, name: "time_zones", displayName: "时区" },
          { id: 2106, name: "translations", displayName: "翻译" }
        ]
      },
      {
        id: 22,
        name: "science",
        displayName: "科学",
        children: [
          { id: 2201, name: "agriculture", displayName: "农业" },
          { id: 2202, name: "astronomy", displayName: "天文学" },
          { id: 2203, name: "biology", displayName: "生物学" },
          { id: 2204, name: "chemistry", displayName: "化学" },
          { id: 2205, name: "earth_sciences", displayName: "地球科学" },
          { id: 2206, name: "environment", displayName: "环境" },
          { id: 2207, name: "mathematics", displayName: "数学" },
          { id: 2208, name: "physics", displayName: "物理学" },
          { id: 2209, name: "social_sciences", displayName: "社会科学" }
        ]
      },
      {
        id: 23,
        name: "shopping",
        displayName: "购物",
        children: [
          { id: 2301, name: "apparel", displayName: "服装" },
          { id: 2302, name: "automotive", displayName: "汽车用品" },
          { id: 2303, name: "baby_toddler", displayName: "婴儿用品" },
          { id: 2304, name: "beauty_personal_care", displayName: "美容个人护理" },
          { id: 2305, name: "books", displayName: "图书" },
          { id: 2306, name: "computers", displayName: "计算机" },
          { id: 2307, name: "electronics", displayName: "电子产品" },
          { id: 2308, name: "food_beverages", displayName: "食品饮料" },
          { id: 2309, name: "gifts", displayName: "礼品" },
          { id: 2310, name: "health", displayName: "健康" },
          { id: 2311, name: "home_garden", displayName: "家居园艺" },
          { id: 2312, name: "jewelry", displayName: "珠宝" },
          { id: 2313, name: "office_products", displayName: "办公用品" },
          { id: 2314, name: "pets", displayName: "宠物用品" },
          { id: 2315, name: "sports_outdoor", displayName: "体育户外" },
          { id: 2316, name: "toys_games", displayName: "玩具游戏" },
          { id: 2317, name: "travel", displayName: "旅行" }
        ]
      },
      {
        id: 24,
        name: "society",
        displayName: "社会",
        children: [
          { id: 2401, name: "charity", displayName: "慈善" },
          { id: 2402, name: "crime", displayName: "犯罪" },
          { id: 2403, name: "demographics", displayName: "人口统计" },
          { id: 2404, name: "education", displayName: "教育" },
          { id: 2405, name: "family", displayName: "家庭" },
          { id: 2406, name: "lifestyle", displayName: "生活方式" },
          { id: 2407, name: "relationships", displayName: "人际关系" },
          { id: 2408, name: "religion", displayName: "宗教" },
          { id: 2409, name: "social_issues", displayName: "社会问题" }
        ]
      },
      {
        id: 25,
        name: "sports",
        displayName: "体育",
        children: [
          { id: 2501, name: "baseball", displayName: "棒球" },
          { id: 2502, name: "basketball", displayName: "篮球" },
          { id: 2503, name: "boxing", displayName: "拳击" },
          { id: 2504, name: "cricket", displayName: "板球" },
          { id: 2505, name: "football", displayName: "足球" },
          { id: 2506, name: "golf", displayName: "高尔夫" },
          { id: 2507, name: "hockey", displayName: "曲棍球" },
          { id: 2508, name: "martial_arts", displayName: "武术" },
          { id: 2509, name: "motor_sports", displayName: "赛车" },
          { id: 2510, name: "olympics", displayName: "奥运会" },
          { id: 2511, name: "soccer", displayName: "足球" },
          { id: 2512, name: "tennis", displayName: "网球" },
          { id: 2513, name: "track_field", displayName: "田径" },
          { id: 2514, name: "water_sports", displayName: "水上运动" },
          { id: 2515, name: "winter_sports", displayName: "冬季运动" }
        ]
      },
      {
        id: 26,
        name: "travel",
        displayName: "旅行",
        children: [
          { id: 2601, name: "adventure_travel", displayName: "探险旅行" },
          { id: 2602, name: "air_travel", displayName: "航空旅行" },
          { id: 2603, name: "business_travel", displayName: "商务旅行" },
          { id: 2604, name: "car_rental", displayName: "租车" },
          { id: 2605, name: "cruises", displayName: "邮轮" },
          { id: 2606, name: "destinations", displayName: "目的地" },
          { id: 2607, name: "hotels", displayName: "酒店" },
          { id: 2608, name: "travel_planning", displayName: "旅行规划" },
          { id: 2609, name: "vacation_rentals", displayName: "度假租赁" }
        ]
      }
    ]
  }
];

// 获取所有分类的扁平化列表
export function getAllCategories(): GoogleTrendsCategory[] {
  const categories: GoogleTrendsCategory[] = [];
  
  function flatten(cats: GoogleTrendsCategory[]) {
    for (const cat of cats) {
      categories.push(cat);
      if (cat.children) {
        flatten(cat.children);
      }
    }
  }
  
  flatten(GOOGLE_TRENDS_CATEGORIES);
  return categories;
}

// 根据ID查找分类
export function getCategoryById(id: number): GoogleTrendsCategory | undefined {
  return getAllCategories().find(cat => cat.id === id);
}

// 根据名称查找分类
export function getCategoryByName(name: string): GoogleTrendsCategory | undefined {
  return getAllCategories().find(cat => cat.name === name);
}

// 获取顶级分类
export function getTopLevelCategories(): GoogleTrendsCategory[] {
  return GOOGLE_TRENDS_CATEGORIES[0].children || [];
}

// 获取指定分类的子分类
export function getSubCategories(parentId: number): GoogleTrendsCategory[] {
  const parent = getCategoryById(parentId);
  return parent?.children || [];
}
