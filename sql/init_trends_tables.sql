-- TikTok Trends 数据库初始化脚本
-- 创建所有必要的表结构

-- 1. 数据源表
CREATE TABLE IF NOT EXISTS trend_source (
  source_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL
);

-- 2. 类目映射表
CREATE TABLE IF NOT EXISTS trend_category_map (
  category_key TEXT PRIMARY KEY,
  gt_category_id INTEGER,
  ttc_channel TEXT,
  include_rules JSONB,
  exclude_rules JSONB
);

-- 3. 国家映射表
CREATE TABLE IF NOT EXISTS country_map (
  country TEXT PRIMARY KEY,
  gt_geo TEXT NOT NULL,
  ttc_region TEXT NOT NULL
);

-- 4. 原始数据表
CREATE TABLE IF NOT EXISTS trend_raw (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT REFERENCES trend_source(source_id),
  country TEXT,
  category_key TEXT,
  window_period TEXT CHECK (window_period IN ('1d','7d','30d')),
  keyword TEXT NOT NULL,
  rank INTEGER,
  raw_score NUMERIC,
  meta_json JSONB,
  collected_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 每日归一化数据表
CREATE TABLE IF NOT EXISTS trend_keyword_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT,
  country TEXT,
  category_key TEXT,
  window_period TEXT,
  g_score NUMERIC,
  t_score NUMERIC,
  trend_score NUMERIC,
  g_rank INTEGER,
  t_rank INTEGER,
  sources JSONB,
  collected_date DATE
);

-- 6. 关键词池表
CREATE TABLE IF NOT EXISTS keyword_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT,
  country TEXT,
  category_key TEXT,
  first_seen DATE,
  last_seen DATE,
  last_score NUMERIC,
  hit_days INTEGER DEFAULT 1
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_trend_raw_source_country ON trend_raw(source_id, country);
CREATE INDEX IF NOT EXISTS idx_trend_raw_category ON trend_raw(category_key);
CREATE INDEX IF NOT EXISTS idx_trend_raw_window ON trend_raw(window_period);
CREATE INDEX IF NOT EXISTS idx_trend_raw_collected_at ON trend_raw(collected_at);
CREATE INDEX IF NOT EXISTS idx_trend_raw_keyword ON trend_raw(keyword);

CREATE INDEX IF NOT EXISTS idx_trend_daily_keyword ON trend_keyword_daily(keyword);
CREATE INDEX IF NOT EXISTS idx_trend_daily_country ON trend_keyword_daily(country);
CREATE INDEX IF NOT EXISTS idx_trend_daily_date ON trend_keyword_daily(collected_date);

CREATE INDEX IF NOT EXISTS idx_keyword_pool_keyword ON keyword_pool(keyword);
CREATE INDEX IF NOT EXISTS idx_keyword_pool_country ON keyword_pool(country);

-- 插入基础数据
INSERT INTO trend_source (source_id, display_name) VALUES 
  ('google_trends', 'Google Trends'),
  ('tiktok_trends', 'TikTok Creative Center')
ON CONFLICT (source_id) DO NOTHING;

INSERT INTO trend_category_map (category_key, gt_category_id, ttc_channel) VALUES 
  ('shopping', 18, 'Shopping'),
  ('tech_electronics', NULL, 'Technology'),
  ('vehicle_transportation', NULL, 'Transportation')
ON CONFLICT (category_key) DO NOTHING;

INSERT INTO country_map (country, gt_geo, ttc_region) VALUES 
  ('US', 'US', 'US'),
  ('UK', 'GB', 'GB'),
  ('FR', 'FR', 'FR'),
  ('DE', 'DE', 'DE')
ON CONFLICT (country) DO NOTHING;

-- 创建视图：趋势数据汇总
CREATE OR REPLACE VIEW v_trends_summary AS
SELECT 
  tr.keyword,
  tr.country,
  tr.category_key,
  tr.window_period,
  tr.source_id,
  tr.rank,
  tr.raw_score,
  tr.collected_at,
  ts.display_name as source_name
FROM trend_raw tr
JOIN trend_source ts ON tr.source_id = ts.source_id
ORDER BY tr.collected_at DESC, tr.rank ASC;

-- 创建函数：获取最新趋势数据
CREATE OR REPLACE FUNCTION get_latest_trends(
  p_country TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_window TEXT DEFAULT NULL,
  p_source TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  keyword TEXT,
  country TEXT,
  category_key TEXT,
  window_period TEXT,
  source_id TEXT,
  rank INTEGER,
  raw_score NUMERIC,
  collected_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (tr.keyword, tr.country, tr.category_key, tr.window_period, tr.source_id)
    tr.keyword,
    tr.country,
    tr.category_key,
    tr.window_period,
    tr.source_id,
    tr.rank,
    tr.raw_score,
    tr.collected_at
  FROM trend_raw tr
  WHERE 
    (p_country IS NULL OR tr.country = p_country)
    AND (p_category IS NULL OR tr.category_key = p_category)
    AND (p_window IS NULL OR tr.window_period = p_window)
    AND (p_source IS NULL OR tr.source_id = p_source)
  ORDER BY tr.keyword, tr.country, tr.category_key, tr.window_period, tr.source_id, tr.collected_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 创建函数：更新关键词池
CREATE OR REPLACE FUNCTION update_keyword_pool()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  -- 插入新关键词
  INSERT INTO keyword_pool (keyword, country, category_key, first_seen, last_seen, last_score, hit_days)
  SELECT 
    tr.keyword,
    tr.country,
    tr.category_key,
    tr.collected_at::DATE,
    tr.collected_at::DATE,
    tr.raw_score,
    1
  FROM trend_raw tr
  WHERE NOT EXISTS (
    SELECT 1 FROM keyword_pool kp 
    WHERE kp.keyword = tr.keyword 
    AND kp.country = tr.country 
    AND kp.category_key = tr.category_key
  )
  AND tr.collected_at::DATE = CURRENT_DATE;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- 更新已存在的关键词
  UPDATE keyword_pool 
  SET 
    last_seen = tr.collected_at::DATE,
    last_score = tr.raw_score,
    hit_days = hit_days + 1
  FROM trend_raw tr
  WHERE keyword_pool.keyword = tr.keyword
    AND keyword_pool.country = tr.country
    AND keyword_pool.category_key = tr.category_key
    AND tr.collected_at::DATE = CURRENT_DATE
    AND keyword_pool.last_seen < tr.collected_at::DATE;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：自动更新关键词池
CREATE OR REPLACE FUNCTION trigger_update_keyword_pool()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_keyword_pool();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_keyword_pool ON trend_raw;
CREATE TRIGGER trg_update_keyword_pool
  AFTER INSERT ON trend_raw
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_update_keyword_pool();

-- 创建定时任务清理函数（可选）
CREATE OR REPLACE FUNCTION cleanup_old_trends(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM trend_raw 
  WHERE collected_at < NOW() - INTERVAL '1 day' * days_to_keep;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 显示创建结果
SELECT 'Tables created successfully' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'trend_%' ORDER BY table_name;
