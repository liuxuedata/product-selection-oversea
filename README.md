# Product Selection Platform

一个基于 Next.js 的跨境电商选品平台，集成了 AI 选品专家分析功能。

## 🚀 主要功能

### 📊 产品评分系统
- **平台站评分**：基于销量、评论、竞争度等维度
- **独立站评分**：基于价格、新品优势、评论联动等维度
- **实时评分预览**：支持参数调整和实时预览
- **批量评分计算**：支持全量产品重新评分

### 🤖 AI 选品专家分析
- **专业分析报告**：市场潜力、竞争力、风险评估
- **选品建议**：推荐指数、适合平台、目标市场
- **历史记录**：保存分析历史，支持对比查看
- **多模型支持**：GPT-4o、GPT-4o Mini、GPT-3.5 Turbo

### 📈 趋势数据采集
- **TikTok Trends**：采集热门关键词和趋势数据
- **Google Trends**：获取搜索趋势和相关性数据
- **多国家支持**：US、UK、CA、AU、DE、FR、JP
- **多分类覆盖**：电子产品、家居、美妆、服装等

### 📋 数据管理
- **Excel/CSV 导入**：支持 Helium10 BlackBox 数据导入
- **去重处理**：基于 ASIN 和 URL 自动去重
- **分页展示**：支持大数据量的分页浏览
- **筛选排序**：多维度筛选和排序功能

## 🛠️ 技术栈

- **前端框架**：Next.js 14 + TypeScript
- **样式系统**：Tailwind CSS
- **数据库**：Supabase PostgreSQL
- **AI 服务**：OpenAI API
- **部署平台**：Vercel
- **数据采集**：Playwright、HTTP API、RSS

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 环境变量配置
在 `.env.local` 文件中配置以下变量：

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI 配置
AI_API_KEY=your_openai_api_key
AI_API_BASE=https://api.openai.com/v1
AI_MODEL=gpt-4o
```

### 启动开发服务器
```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 📖 使用指南

### 1. 数据导入
1. 访问首页，上传 Helium10 BlackBox 导出的 Excel/CSV 文件
2. 系统自动解析数据并去重存储
3. 查看导入统计和文件详情

### 2. 产品评分
1. 在 `/settings` 页面配置评分参数
2. 调整各维度权重，实时预览评分效果
3. 保存配置并应用到全量产品

### 3. AI 分析
1. 在产品详情页点击"开始 AI 分析"
2. 选择 AI 模型和服务商
3. 获取专业的选品分析报告
4. 查看历史分析记录

### 4. 趋势数据
1. 在 `/trends` 页面查看趋势数据
2. 按国家、分类、时间筛选
3. 手动采集最新趋势数据
4. 查看关键词详情和相关性分析

## 🔧 开发命令

- `npm run dev` – 启动开发服务器
- `npm run build` – 构建生产版本
- `npm run lint` – 运行 ESLint 检查
- `npm run start` – 启动生产服务器

## 📁 项目结构

```
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   ├── ai-review/     # AI 分析 API
│   │   ├── jobs/          # 数据采集任务
│   │   └── trends/        # 趋势数据 API
│   ├── config/            # 配置页面
│   ├── products/          # 产品相关页面
│   └── trends/            # 趋势数据页面
├── components/            # React 组件
│   ├── AiReview.tsx       # AI 分析组件
│   ├── ScoreBadge.tsx     # 评分徽章
│   └── UploadForm.tsx     # 文件上传组件
├── lib/                   # 工具库
│   ├── ai/                # AI 相关配置
│   ├── scoring/           # 评分引擎
│   └── supabase.ts        # 数据库客户端
├── scripts/               # 脚本文件
└── utils/                 # 工具函数
```

## 🤖 AI 分析功能详解

### 分析维度
1. **市场潜力评估** (1-10分)
   - 市场需求分析
   - 竞争激烈程度
   - 增长趋势判断

2. **产品竞争力分析** (1-10分)
   - 价格竞争力
   - 质量指标评估
   - 差异化优势

3. **运营风险评估** (1-10分)
   - 供应链风险
   - 政策合规风险
   - 季节性影响

4. **选品建议**
   - 推荐指数 (1-5星)
   - 适合平台 (平台站/独立站/两者)
   - 目标市场建议
   - 关键成功因素

5. **具体行动建议**
   - 是否值得进入
   - 建议的进入策略
   - 需要关注的风险点

### 支持的 AI 模型
- **GPT-4o**：最新最强模型，分析质量最高
- **GPT-4o Mini**：性价比高，适合批量分析
- **GPT-3.5 Turbo**：快速响应，成本最低

## 🔒 环境变量说明

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | ✅ |
| `AI_API_KEY` | OpenAI API 密钥 | ✅ |
| `AI_API_BASE` | AI API 基础 URL | ❌ |
| `AI_MODEL` | 默认 AI 模型 | ❌ |

## 📚 相关文档

- [项目开发指南](PROJECT_GUIDE.md) - 详细的技术实现说明
- [趋势数据集成](PROJECT_TRENDS_INTEGRATION.md) - 趋势数据采集功能说明
- [配置页面](app/config/page.tsx) - 评分标准和 AI 配置说明

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。
# UI 指令
请基于 `/designs/AntDesign Pro 4.0.sketch` 的设计规范，为以下功能开发页面：

- 产品列表页（展示完整数据 + 综合评分）
- 推荐产品页（展示 >=55 分产品，70 分以上标黄，85 分以上标红）
- 产品详情页（点击行跳转，展示完整数据与评分）
- 导航页（独立站、平台选品、推荐产品、详情页模块）

要求：
1. 使用 AntDesign Pro 的页面结构、导航布局。
2. 保持和 Sketch 文件一致的 UI 风格（导航、卡片、表格、评分颜色）。
3. 数据接口用现有的评分脚本和 `recommendation production` 表输出（参考 `/scripts/平台选品评分.js`、`/scripts/选品归集.js`）。
