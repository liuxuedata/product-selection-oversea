# Product Selection Platform

Initial Next.js project scaffold for product-selection-oversea. See `PROJECT_GUIDE.md` for the full development plan.

## Development

- `npm run dev` – start development server
- `npm run build` – build for production
- `npm run lint` – run eslint

Environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_BASE=https://api.openai.com/v1
OPENAI_API_KEY=
```

AI 模型可在 `/config` 页面选择，支持扩展到不同提供商与模型。
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
