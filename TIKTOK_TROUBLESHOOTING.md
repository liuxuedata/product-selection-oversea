# TikTok 数据获取问题排查指南

## 🔍 问题诊断

经过代码分析，发现TikTok数据获取问题的根本原因：

### 1. **缺少真正的爬虫实现**
- ❌ 原有的 `fetch_tiktok_trends_ci.mjs` 只是生成模拟数据
- ❌ 工作流中引用的 `fetch_tiktok_trends.ts` 文件不存在
- ❌ 没有真正的Playwright爬虫来访问TikTok Creative Center

### 2. **依赖缺失**
- ❌ `package.json` 中没有安装 `playwright` 依赖
- ❌ 工作流中虽然安装了Playwright，但没有对应的爬虫脚本

### 3. **环境配置问题**
- ❌ 需要 `TTC_STATE_JSON` 环境变量存储TikTok登录状态
- ❌ 可能登录态已过期或无效

## 🛠️ 解决方案

### 1. **已完成的修复**

#### ✅ 添加Playwright依赖
```json
{
  "devDependencies": {
    "playwright": "^1.40.0"
  }
}
```

#### ✅ 创建真正的TikTok爬虫
- 📁 `scripts/fetch_tiktok_trends.ts` - 完整的Playwright爬虫实现
- 🔧 支持多国家/地区：US, UK, FR, DE
- 🔧 支持多类目：Tech & Electronics, Vehicle & Transportation
- 🔧 支持多时间窗口：1d, 7d, 30d

#### ✅ 更新API路由
- 📁 `app/api/jobs/fetch-tiktok/route.ts` - 集成真正的爬虫调用
- 🔧 支持查询参数：country, category_key, window_period
- 🔧 返回详细的爬虫执行结果

#### ✅ 更新工作流
- 📁 `workflows/trends.yml` - 使用真正的爬虫脚本
- 🔧 添加环境变量配置

#### ✅ 数据库初始化
- 📁 `sql/init_trends_tables.sql` - 完整的数据库表结构
- 🔧 包含索引、视图、函数和触发器

#### ✅ 测试脚本
- 📁 `scripts/test_tiktok_scraper.ts` - 用于测试爬虫功能

### 2. **需要配置的环境变量**

在Vercel或GitHub Secrets中设置：

```bash
# 数据库连接
PG_DSN_POOL=postgresql://...
POSTGRES_URL=postgresql://...

# TikTok登录态（可选，但推荐）
TTC_STATE_JSON={"cookies":[...],"origins":[...]}

# 爬虫配置
MARKETS=US,UK,FR,DE
CATEGORIES=tech_electronics,vehicle_transportation
WINDOWS=7d,30d
```

### 3. **获取TikTok登录态**

如果TikTok Creative Center需要登录，按以下步骤获取登录态：

1. **手动登录获取状态文件**：
   ```bash
   # 运行测试脚本，手动登录后保存状态
   npx ts-node scripts/test_tiktok_scraper.ts
   ```

2. **使用Playwright获取登录态**：
   ```typescript
   // 在浏览器中手动登录后，保存状态
   await context.storageState({ path: 'tiktok_state.json' });
   ```

3. **将状态文件内容设置为环境变量**：
   ```bash
   TTC_STATE_JSON=$(cat tiktok_state.json)
   ```

## 🧪 测试步骤

### 1. **本地测试**
```bash
# 安装依赖
npm install

# 安装Playwright浏览器
npx playwright install

# 运行测试脚本
npx ts-node scripts/test_tiktok_scraper.ts

# 运行爬虫
npx ts-node scripts/fetch_tiktok_trends.ts
```

### 2. **API测试**
```bash
# 测试TikTok数据获取API
curl "http://localhost:3000/api/jobs/fetch-tiktok?country=US&category_key=tech_electronics&window_period=7d"
```

### 3. **数据库测试**
```sql
-- 执行数据库初始化
\i sql/init_trends_tables.sql

-- 查看数据
SELECT * FROM trend_raw ORDER BY collected_at DESC LIMIT 10;
```

## 🚨 可能的问题和解决方案

### 1. **网络访问问题**
- **问题**：无法访问TikTok Creative Center
- **解决**：检查网络连接，可能需要代理或VPN

### 2. **登录态过期**
- **问题**：API返回401或需要登录
- **解决**：重新获取登录态文件并更新环境变量

### 3. **反爬虫检测**
- **问题**：被TikTok检测到自动化行为
- **解决**：
  - 增加请求间隔
  - 使用更真实的User-Agent
  - 随机化请求时间
  - 使用代理IP

### 4. **API结构变化**
- **问题**：TikTok更改了API结构
- **解决**：更新爬虫代码中的选择器和API端点

### 5. **地区限制**
- **问题**：某些地区无法访问TikTok Creative Center
- **解决**：使用代理或更改服务器地区

## 📊 监控和日志

### 1. **查看爬虫日志**
```bash
# 在Vercel函数日志中查看
vercel logs

# 在GitHub Actions中查看
# 访问仓库的Actions页面
```

### 2. **数据库监控**
```sql
-- 查看今日数据量
SELECT COUNT(*) FROM trend_raw WHERE collected_at::date = CURRENT_DATE;

-- 查看各来源数据量
SELECT source_id, COUNT(*) FROM trend_raw GROUP BY source_id;

-- 查看最新数据
SELECT * FROM trend_raw ORDER BY collected_at DESC LIMIT 10;
```

## 🔄 自动化部署

### 1. **GitHub Actions**
- 工作流已配置为每天UTC 02:00和14:00自动运行
- 支持手动触发：`workflow_dispatch`

### 2. **Vercel Cron**
- 可以配置Vercel Cron Jobs进行定时执行
- 建议使用GitHub Actions而不是Vercel Cron（避免超时）

## 📝 下一步计划

1. **测试新的爬虫实现**
2. **配置TikTok登录态**
3. **监控数据获取情况**
4. **优化爬虫性能和稳定性**
5. **添加更多数据源**

## 🆘 如果问题仍然存在

1. **检查网络连接**：确保可以访问TikTok Creative Center
2. **更新登录态**：重新获取并设置TTC_STATE_JSON
3. **查看详细日志**：检查具体的错误信息
4. **联系支持**：如果问题持续存在，可能需要调整爬虫策略

---

**注意**：TikTok Creative Center可能有反爬虫措施，建议：
- 使用合理的请求频率
- 避免过于频繁的访问
- 遵守TikTok的使用条款
- 考虑使用官方API（如果有的话）
