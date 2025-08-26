PROJECT_TRENDS_INTEGRATION.md
目标

每日自动获取 Google Trends 与 TikTok Creative Center 热门关键词。

地区覆盖：US / UK / FR / DE。

类别覆盖：

Google Trends → Shopping

TikTok → Tech & Electronics / Vehicle & Transportation

数据入库并清洗 → 统一归一化 → 与选品评分体系结合 → 前端展示。

网站顶部导航栏新增 Trends 模块，全局可访问。

一、数据库设计
-- 数据源
-- 数据源
create table if not exists trend_source (
  source_id text primary key,       -- 'google_trends', 'tiktok_trends'
  display_name text not null
);

-- 类目映射
create table if not exists trend_category_map (
  category_key text primary key,    -- 'shopping', 'tech_electronics', 'vehicle_transport'
  gt_category_id int,               -- Google Trends category id
  ttc_channel text,                 -- TikTok 频道
  include_rules jsonb,              -- 包含规则
  exclude_rules jsonb               -- 排除规则
);

-- 国家映射
create table if not exists country_map (
  country text primary key,         -- 'US','UK','FR','DE'
  gt_geo text not null,             -- Google Trends geo
  ttc_region text not null          -- TikTok region code
);

-- 原始数据
create table if not exists trend_raw (
  id uuid primary key default gen_random_uuid(),
  source_id text references trend_source(source_id),
  country text,
  category_key text,
  window_period text check (window_period in ('1d','7d','30d')), -- 避免使用保留字 window
  keyword text not null,
  rank int,
  raw_score numeric,
  meta_json jsonb,
  collected_at timestamptz default now()
);

-- 每日归一化数据
create table if not exists trend_keyword_daily (
  id uuid primary key default gen_random_uuid(),
  keyword text,
  country text,
  category_key text,
  window_period text,
  g_score numeric,
  t_score numeric,
  trend_score numeric,
  g_rank int,
  t_rank int,
  sources jsonb,
  collected_date date
);

-- 关键词池
create table if not exists keyword_pool (
  id uuid primary key default gen_random_uuid(),
  keyword text,
  country text,
  category_key text,
  first_seen date,
  last_seen date,
  last_score numeric,
  hit_days int default 1
);


二、采集任务
Google Trends

工具：pytrends

类目：Shopping (id=18)

时间窗：1d / 7d / 30d

国家：US, UK(GB), FR, DE

TikTok Trends

工具：Playwright / Puppeteer

类别：Tech & Electronics, Vehicle & Transportation

区域：US, UK, FR, DE

数据：关键词、热度、排名、时间序列

三、数据清洗与归一化

归一化

按来源/国家/类目/窗口 → raw_score 转换为 0~100

综合分 trend_score

trend_score = 0.6*g_score + 0.4*t_score

关键词池更新

如果新关键词 → 插入 keyword_pool

如果已存在 → 更新 last_seen、last_score、hit_days

四、与现有评分体系的结合

来自 平台选品参数.txt、独立站选品评分标准.txt、评分脚本 JS

新增字段：trend_score_7d → 融入综合评分：

若 trend_score >= 70 → 给予额外加权 +0.05 ~ +0.1

在 选品归集.js 增加逻辑：将 trend_score >= 55 的关键词推送至 recommendation production 表。

五、前端页面
全局导航

在顶部导航栏新增：

{ "label": "Trends", "href": "/trends", "position": "top", "highlight": true }

/trends 页面

筛选条件：国家（US/UK/FR/DE）、类目（Shopping/Tech/Vehicle）、窗口（1d/7d/30d）

表格列：Keyword / TrendScore / G Score / T Score / Rank / 来源

分数颜色：

>=85 → 绿色（优秀）

70-84 → 蓝色（潜力）

55-69 → 黄色（一般）

<55 → 灰色（低潜）

/trends/[keyword] 详情页

曲线展示：Google vs TikTok 7天/30天趋势

来源卡片：分数、排名、环比变化

跳转 → 选品评分详情页

六、自动化调度

每日两次执行（UTC 00:30 & 12:30）

顺序：

fetch_google_trends.py

fetch_tiktok_trends.ts

consolidate_trends.sql

配置 Vercel Cron 或 GitHub Actions 定时任务

七、交付验收标准

/trends 页面可正常展示 US/UK/FR/DE 数据

TikTok + Google 数据均入库成功

综合评分 ≥70 的关键词能推送到现有选品库

导航栏顶部固定显示 Trends 入口

