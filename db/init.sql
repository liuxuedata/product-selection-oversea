-- Database initialization script for product scoring
-- Creates tables, indexes, view, and inserts default scoring profiles and revisions.

-- 1) File dimension table
create table if not exists blackbox_files (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  sheet_name text,
  row_count int,
  column_names jsonb,
  uploaded_by text,
  uploaded_at timestamptz default now()
);

-- 2) Row dimension table with original data
create table if not exists blackbox_rows (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references blackbox_files(id) on delete cascade,
  row_index int,
  asin text,
  url text,
  title text,
  data jsonb not null,
  inserted_at timestamptz default now(),
  asin_norm text generated always as (nullif(lower(btrim(asin)), '')) stored,
  url_norm  text generated always as (nullif(lower(btrim(url)),  '')) stored
);
create unique index if not exists uq_blackbox_rows_asin_norm on blackbox_rows(asin_norm) where asin_norm is not null;
create unique index if not exists uq_blackbox_rows_url_norm  on blackbox_rows(url_norm)  where url_norm  is not null;
create index if not exists idx_blackbox_rows_file on blackbox_rows(file_id);

-- 3) Scoring results bound to individual rows
create table if not exists product_scores (
  id uuid primary key default gen_random_uuid(),
  row_id uuid not null references blackbox_rows(id) on delete cascade,
  platform_score numeric,
  independent_score numeric,
  meta jsonb,
  scored_at timestamptz default now()
);
create index if not exists idx_product_scores_row on product_scores(row_id);

-- 4) Scoring profiles and revisions
create table if not exists scoring_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  is_active boolean default false,
  created_by text,
  created_at timestamptz default now()
);
create table if not exists scoring_profile_revisions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references scoring_profiles(id) on delete cascade,
  version int not null,
  params jsonb not null,
  changelog text,
  created_by text,
  created_at timestamptz default now()
);
create index if not exists idx_spr_profile on scoring_profile_revisions(profile_id);

-- 5) View joining rows with scores
create or replace view v_blackbox_rows_with_scores as
select
  r.id as row_id,
  r.file_id,
  r.row_index,
  r.asin,
  r.url,
  r.title,
  r.data,
  s.platform_score,
  s.independent_score,
  s.scored_at
from blackbox_rows r
left join product_scores s on s.row_id = r.id;

-- Seed default scoring profiles and revisions
-- Platform default profile
with platform_profile as (
  insert into scoring_profiles (name, description, is_active, created_by)
  values ('platform_default', '平台站V3默认评分方案', true, 'system')
  returning id
)
insert into scoring_profile_revisions (profile_id, version, params, changelog, created_by)
select id, 1,
$$
{
  "label": "平台站V3（默认）",
  "note": "价格10-200美金最优，销量/趋势/评论沉淀权重更高；卖家数适中最优（10-40）。",
  "dimensions": [
    {"key":"price","label":"价格","weight":0.02,"explain":"平台适销价10-200美金；80附近最优，过低/过高递减。","formula":"piecewise","fieldCandidates":["Price","价格","Buy Box Price"],"segments":[{"lt":10,"scoreExpr":"30 + x*4"},{"gte":10,"lte":200,"scoreExpr":"70 + (200 - Math.abs(x-80))*0.3"},{"gt":200,"scoreExpr":"Math.max(30, 100 - (x-200)*0.3)"}],"bounds":{"min":0,"max":5000}},
    {"key":"price_trend_90d","label":"价格趋势（90天）","weight":0.02,"explain":"越涨分越高；负增长降分。","formula":"piecewise","fieldCandidates":["Price Trend (90 days)","价格趋势（90天）","Price Trend"],"segments":[{"gte":50,"score":100},{"gte":0,"lt":50,"scoreExpr":"50 + x"},{"lt":0,"scoreExpr":"Math.max(0, 50 + x)"}]},
    {"key":"asin_sales","label":"ASIN销量（月）","weight":0.11,"explain":"核心：量大潜力大；2000满分线性。","formula":"piecewise","fieldCandidates":["Monthly Sales","ASIN 销量","销量"],"segments":[{"gte":2000,"score":100},{"lt":2000,"scoreExpr":"x/20"}]},
    {"key":"sales_trend_90d","label":"销量趋势（90天）","weight":0.09,"explain":"趋势为正→爆品信号；越涨越高。","formula":"piecewise","fieldCandidates":["Sales Trend (90 days)","销量趋势（90天）","Sales Trend"],"segments":[{"gte":50,"score":100},{"gte":0,"lt":50,"scoreExpr":"50 + x"},{"lt":0,"scoreExpr":"Math.max(0, 50 + x)"}]},
    {"key":"parent_revenue","label":"父级收入（$）","weight":0.07,"explain":"销售额重要；10万满分线性。","formula":"piecewise","fieldCandidates":["Parent Revenue","父级收入","Parent Sales Revenue","Revenue (Parent)"],"segments":[{"gte":100000,"score":100},{"lt":100000,"scoreExpr":"x/1000"}]},
    {"key":"asin_revenue","label":"ASIN收入（$）","weight":0.07,"explain":"5万满分线性。","formula":"piecewise","fieldCandidates":["Revenue","ASIN 收入","ASIN Revenue"],"segments":[{"gte":50000,"score":100},{"lt":50000,"scoreExpr":"x/500"}]},
    {"key":"review_combo","label":"评论联动（数量×评分）","weight":0.16,"explain":"评论数量与评分联动，乘积法更严谨（沉淀+口碑）。","formula":"composite","parts":[{"type":"reviewCount","fieldCandidates":["Review Count","评论数量"],"rules":[{"gte":4000,"scoreExpr":"Math.max(75, 100 - (x-2000)*0.0125)"},{"gte":2000,"lt":4000,"scoreExpr":"100 - (x-2000)*0.0125"},{"gte":1000,"lt":2000,"scoreExpr":"90 + 10*(x-1000)/1000"},{"gte":100,"lt":1000,"scoreExpr":"50 + 40*(x-100)/900"},{"gte":20,"lt":100,"scoreExpr":"20 + 30*(x-20)/80"},{"lt":20,"scoreExpr":"x*1"}]},{"type":"reviewRating","fieldCandidates":["Review Rating","评论评分"],"rules":[{"gte":4.7,"score":100},{"gte":4.5,"lt":4.7,"scoreExpr":"80 + 20*(x-4.5)/0.2"},{"gte":4.2,"lt":4.5,"scoreExpr":"60 + 20*(x-4.2)/0.3"},{"gte":4.0,"lt":4.2,"scoreExpr":"50 + 10*(x-4.0)/0.2"},{"lt":4.0,"scoreExpr":"Math.max(20, x*10)"}]}],"aggregate":"multiplyReview","bounds":{"min":0,"max":100}},
    {"key":"seller_count","label":"活跃卖家数","weight":0.07,"explain":"10-40最优，过少/过多都降分。","formula":"piecewise","fieldCandidates":["Active Sellers","活跃卖家数量","Seller Count"],"segments":[{"gte":10,"lte":40,"score":100},{"lt":10,"scoreExpr":"x*10"},{"gt":40,"lt":100,"scoreExpr":"100 - (x-40)*2"},{"gte":100,"score":0}]},
    {"key":"last_year_sales","label":"去年销量","weight":0.07,"explain":"有历史沉淀更稳；1500满分线性。","formula":"piecewise","fieldCandidates":["Last Year Sales","去年销量"],"segments":[{"gte":1500,"score":100},{"lt":1500,"scoreExpr":"x/15"}]},
    {"key":"yoy","label":"年同比（%）","weight":0.07,"explain":"年度增速；负增长显著降分。","formula":"piecewise","fieldCandidates":["YoY (%)","销量年同比(%)","YoY"],"segments":[{"gte":50,"score":100},{"gte":0,"lt":50,"scoreExpr":"50 + x"},{"lt":0,"scoreExpr":"20 + x/2"}]},
    {"key":"size","label":"尺寸分级","weight":0.03,"explain":"小型优于中型，中型优于大型。","formula":"piecewise","fieldCandidates":["Size Tier","尺寸分级"],"segments":[{"scoreExpr":"(String(x).toLowerCase().includes('small') || x==='小型') ? 100 : (String(x).toLowerCase().includes('medium') || x==='中型') ? 70 : 40"}]},
    {"key":"weight","label":"重量（kg）","weight":0.03,"explain":"≤1kg满分；1-5kg递减；>5kg 20分。","formula":"piecewise","fieldCandidates":["Weight","重量"],"segments":[{"lte":1,"score":100},{"gt":1,"lte":5,"scoreExpr":"100 - (x-1)*20"},{"gt":5,"score":20}]},
    {"key":"storage_fees","label":"仓储费用（Jan-Sep + Oct-Dec）","weight":0.03,"explain":"单季≤1且总和<5高分，否则低分。","formula":"piecewise","fieldCandidates":["Storage Fee (Jan-Sep)","仓储费用1-9月","AG","Storage Fee (Oct-Dec)","仓储费用10-12月","AH"],"segments":[{"scoreExpr":"(function(){const a=Number(String(row['Storage Fee (Jan-Sep)']||row['仓储费用1-9月']||row['AG']||0).replace(/[^\\d\\.\\-]/g,'')); const b=Number(String(row['Storage Fee (Oct-Dec)']||row['仓储费用10-12月']||row['AH']||0).replace(/[^\\d\\.\\-]/g,'')); const sum=a+b; return (a<=1 && b<=1) ? 100 : (sum<5 ? 80 : 40);})()"}]},
    {"key":"age_months","label":"年龄（月）","weight":0.06,"explain":"新品更优：≤6月满分；>6 线性降分至40。","formula":"piecewise","fieldCandidates":["Age (Months)","年龄（月）"],"segments":[{"lte":6,"score":100},{"gt":6,"lte":40,"scoreExpr":"100 - 2*(x-6)"},{"gt":40,"score":40}]},
    {"key":"images","label":"图片数","weight":0.02,"explain":"≥5张满分，否则线性。","formula":"piecewise","fieldCandidates":["Image Count","图片数量"],"segments":[{"gte":5,"score":100},{"lt":5,"scoreExpr":"x*20"}]},
    {"key":"variants","label":"变体数","weight":0.02,"explain":"≥2个变体满分，否则线性。","formula":"piecewise","fieldCandidates":["Variant Count","变体数量"],"segments":[{"gte":2,"score":100},{"lt":2,"scoreExpr":"x*50"}]}
  ]
}
$$,
'初始默认版本', 'system'
from platform_profile;

-- Independent default profile
with independent_profile as (
  insert into scoring_profiles (name, description, is_active, created_by)
  values ('independent_default', '独立站V3默认评分方案', true, 'system')
  returning id
)
insert into scoring_profile_revisions (profile_id, version, params, changelog, created_by)
select id, 1,
$$
{
  "label": "独立站V3（默认）",
  "note": "高客单价更优（400+满分）；新品≤6月权重高；评论联动；卖家数适中；与脚本一致。",
  "dimensions": [
    {"key":"price","label":"价格","weight":0.08,"explain":"400+满分，逐级递减；高客单价可覆盖广告成本。","formula":"piecewise","fieldCandidates":["Price","价格","Buy Box Price"],"segments":[{"gte":400,"score":100},{"gte":300,"lt":400,"scoreExpr":"80 + 20*(x-300)/100"},{"gte":200,"lt":300,"scoreExpr":"60 + 20*(x-200)/100"},{"gte":100,"lt":200,"scoreExpr":"40 + 20*(x-100)/100"},{"lt":100,"scoreExpr":"40*x/100"}],"bounds":{"min":0,"max":5000}},
    {"key":"price_trend_90d","label":"价格趋势（90天）","weight":0.05,"explain":"越涨越高分，负增长降分。","formula":"piecewise","fieldCandidates":["Price Trend (90 days)","价格趋势（90天）","Price Trend"],"segments":[{"gte":50,"score":100},{"gte":0,"lt":50,"scoreExpr":"50 + x"},{"lt":0,"scoreExpr":"Math.max(0, 50 + x)"}]},
    {"key":"asin_sales","label":"ASIN销量（月）","weight":0.06,"explain":"线性，2000满分。","formula":"piecewise","fieldCandidates":["Monthly Sales","ASIN 销量","销量"],"segments":[{"gte":2000,"score":100},{"lt":2000,"scoreExpr":"x/20"}]},
    {"key":"sales_trend_90d","label":"销量趋势（90天）","weight":0.06,"explain":"越涨越高分，负增长降分。","formula":"piecewise","fieldCandidates":["Sales Trend (90 days)","销量趋势（90天）","Sales Trend"],"segments":[{"gte":50,"score":100},{"gte":0,"lt":50,"scoreExpr":"50 + x"},{"lt":0,"scoreExpr":"Math.max(0, 50 + x)"}]},
    {"key":"parent_revenue","label":"父级收入（$）","weight":0.06,"explain":"线性，10万满分。","formula":"piecewise","fieldCandidates":["Parent Revenue","父级收入"],"segments":[{"gte":100000,"score":100},{"lt":100000,"scoreExpr":"x/1000"}]},
    {"key":"asin_revenue","label":"ASIN收入（$）","weight":0.06,"explain":"线性，5万满分。","formula":"piecewise","fieldCandidates":["Revenue","ASIN 收入","ASIN Revenue"],"segments":[{"gte":50000,"score":100},{"lt":50000,"scoreExpr":"x/500"}]},
    {"key":"review_combo","label":"评论联动（数量×评分）","weight":0.12,"explain":"评论数量与评分乘积（更严）；与脚本一致。","formula":"composite","parts":[{"type":"reviewCount","fieldCandidates":["Review Count","评论数量"],"rules":[{"gte":4000,"scoreExpr":"Math.max(75, 100 - (x-2000)*0.0125)"},{"gte":2000,"lt":4000,"scoreExpr":"100 - (x-2000)*0.0125"},{"gte":1000,"lt":2000,"scoreExpr":"90 + 10*(x-1000)/1000"},{"gte":100,"lt":1000,"scoreExpr":"50 + 40*(x-100)/900"},{"gte":20,"lt":100,"scoreExpr":"20 + 30*(x-20)/80"},{"lt":20,"scoreExpr":"x*1"}]},{"type":"reviewRating","fieldCandidates":["Review Rating","评论评分"],"rules":[{"gte":4.7,"score":100},{"gte":4.5,"lt":4.7,"scoreExpr":"80 + 20*(x-4.5)/0.2"},{"gte":4.2,"lt":4.5,"scoreExpr":"60 + 20*(x-4.2)/0.3"},{"gte":4.0,"lt":4.2,"scoreExpr":"50 + 10*(x-4.0)/0.2"},{"lt":4.0,"scoreExpr":"Math.max(20, x*10)"}]}],"aggregate":"multiplyReview","bounds":{"min":0,"max":100}},
    {"key":"seller_count","label":"活跃卖家数","weight":0.08,"explain":"10-40最优，其他降分。","formula":"piecewise","fieldCandidates":["Active Sellers","活跃卖家数量","Seller Count"],"segments":[{"gte":10,"lte":40,"score":100},{"lt":10,"scoreExpr":"x*10"},{"gt":40,"lt":100,"scoreExpr":"100 - (x-40)*2"},{"gte":100,"score":0}]},
    {"key":"last_year_sales","label":"去年销量","weight":0.05,"explain":"线性，1500满分。","formula":"piecewise","fieldCandidates":["Last Year Sales","去年销量"],"segments":[{"gte":1500,"score":100},{"lt":1500,"scoreExpr":"x/15"}]},
    {"key":"yoy","label":"年同比（%）","weight":0.05,"explain":"越涨越高分，负增长降分。","formula":"piecewise","fieldCandidates":["YoY (%)","销量年同比(%)","YoY"],"segments":[{"gte":50,"score":100},{"gte":0,"lt":50,"scoreExpr":"50 + x"},{"lt":0,"scoreExpr":"20 + x/2"}]},
    {"key":"size","label":"尺寸分级","weight":0.05,"explain":"小型满分，中型70，大型40。","formula":"piecewise","fieldCandidates":["Size Tier","尺寸分级"],"segments":[{"scoreExpr":"(String(x).toLowerCase().includes('small') || x==='小型') ? 100 : (String(x).toLowerCase().includes('medium') || x==='中型') ? 70 : 40"}]},
    {"key":"weight","label":"重量（kg）","weight":0.04,"explain":"≤1kg满分；1-5kg递减；>5kg 20分。","formula":"piecewise","fieldCandidates":["Weight","重量"],"segments":[{"lte":1,"score":100},{"gt":1,"lte":5,"scoreExpr":"100 - (x-1)*20"},{"gt":5,"score":20}]},
    {"key":"storage_fees","label":"仓储费用（Jan-Sep + Oct-Dec）","weight":0.04,"explain":"≤1+≤1满分；总和<5高分；否则低分。","formula":"piecewise","fieldCandidates":["Storage Fee (Jan-Sep)","仓储费用1-9月","AG","Storage Fee (Oct-Dec)","仓储费用10-12月","AH"],"segments":[{"scoreExpr":"(function(){const a=Number(String(row['Storage Fee (Jan-Sep)']||row['仓储费用1-9月']||row['AG']||0).replace(/[^\\d\\.\\-]/g,'')); const b=Number(String(row['Storage Fee (Oct-Dec)']||row['仓储费用10-12月']||row['AH']||0).replace(/[^\\d\\.\\-]/g,'')); const sum=a+b; return (a<=1 && b<=1) ? 100 : (sum<5 ? 80 : 40);})()"}]},
    {"key":"age_months","label":"年龄（月）","weight":0.09,"explain":"新品优势明显：≤6月满分；>6 线性降分至40。","formula":"piecewise","fieldCandidates":["Age (Months)","年龄（月）"],"segments":[{"lte":6,"score":100},{"gt":6,"lte":40,"scoreExpr":"100 - 2*(x-6)"},{"gt":40,"score":40}]},
    {"key":"images","label":"图片数","weight":0.03,"explain":"≥5张满分，否则线性。","formula":"piecewise","fieldCandidates":["Image Count","图片数量"],"segments":[{"gte":5,"score":100},{"lt":5,"scoreExpr":"x*20"}]},
    {"key":"variants","label":"变体数","weight":0.02,"explain":"≥2个变体满分，否则线性。","formula":"piecewise","fieldCandidates":["Variant Count","变体数量"],"segments":[{"gte":2,"score":100},{"lt":2,"scoreExpr":"x*50"}]}
  ]
}
$$,
'初始默认版本', 'system'
from independent_profile;
