# 本地开发环境设置指南

## 🔧 环境变量配置

由于本地开发环境无法访问Vercel的环境变量，需要手动配置数据库连接。

### 1. 创建本地环境变量文件

在项目根目录创建 `.env.local` 文件：

```bash
# 数据库连接
PG_DSN_POOL=postgresql://username:password@host:port/database
PG_DSN=postgresql://username:password@host:port/database
POSTGRES_URL=postgresql://username:password@host:port/database
POSTGRES_URL_NON_POOLING=postgresql://username:password@host:port/database

# TikTok登录态（可选）
TTC_STATE_JSON={"cookies":[],"origins":[]}

# 其他配置
NODE_TLS_REJECT_UNAUTHORIZED=0
PGSSLMODE=no-verify

# Supabase配置
SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_JWT_SECRET=your_jwt_secret

# 爬虫配置
MARKETS=US,UK,FR,DE
CATEGORIES=tech_electronics,vehicle_transportation
WINDOWS=7d,30d
```

### 2. 获取数据库连接字符串

从Vercel环境变量中复制以下值：
- `POSTGRES_URL`
- `POSTGRES_URL_NON_POOLING`
- `SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_JWT_SECRET`

### 3. 测试连接

配置完成后，运行测试脚本：

```bash
node test_trends_api.js
```

## 🚀 部署到Vercel

在Vercel上，所有环境变量已经配置好了，可以直接使用。

### 测试Vercel部署

```bash
# 测试TikTok数据获取
curl "https://your-app.vercel.app/api/jobs/fetch-tiktok?country=US&category_key=tech_electronics&window_period=7d"

# 测试Google Trends
curl -X POST "https://your-app.vercel.app/api/jobs/fetch-google" \
  -H "Content-Type: application/json" \
  -d '{"country":"US","category_key":"tech_electronics","window_period":"7d"}'

# 测试数据查询
curl "https://your-app.vercel.app/api/trends/search?limit=10"
```

## 📊 数据库表结构

确保数据库中存在以下表：

```sql
-- 主要数据表
CREATE TABLE trend_raw (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT,
  country TEXT,
  category_key TEXT,
  window_period TEXT CHECK (window_period IN ('1d','7d','30d')),
  keyword TEXT NOT NULL,
  rank INTEGER,
  raw_score NUMERIC,
  meta_json JSONB,
  collected_at TIMESTAMPTZ DEFAULT NOW()
);

-- 相关索引
CREATE INDEX idx_trend_raw_collected_at ON trend_raw(collected_at DESC);
CREATE INDEX idx_trend_raw_source_date ON trend_raw(source_id, collected_at DESC);
CREATE INDEX idx_trend_raw_country_date ON trend_raw(country, collected_at DESC);
CREATE INDEX idx_trend_raw_category_window_date ON trend_raw(category_key, window_period, collected_at DESC);
```

## 🔍 故障排除

### 1. 数据库连接失败
- 检查连接字符串是否正确
- 确认数据库服务器可访问
- 检查防火墙设置

### 2. TikTok数据获取失败
- 检查网络连接
- 确认TTC_STATE_JSON是否有效
- 查看详细错误日志

### 3. 模块导入错误
- 确认文件路径正确
- 检查TypeScript配置
- 重新安装依赖

## 📝 下一步

1. 配置本地环境变量
2. 测试数据库连接
3. 测试TikTok数据获取
4. 部署到Vercel并验证
