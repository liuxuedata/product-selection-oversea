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
```
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







# 独立站选品评分 · V4（网站版）变更说明

> 目标：强调「新品优先 + 上升趋势 + 利润空间」。本版仅调整“评分规则与权重”，接口与页面结构保持不变（除非特别说明）。

## 1) 评分阈值（保持不变）
- **85–100**：Excellent（优质）
- **70–85**：Potential（潜力）
- **55–70**：Average（一般）
- **<55**：Low（低潜）

> 前端继续按这四档渲染徽标/配色；推荐清单规则（≥55）不变。

---

## 2) 权重（V4）
| 维度 | 权重 | 说明 |
|---|---:|---|
| ASIN销量 | 0.08 | 量大有潜力 |
| **销量趋势（90天）** | **0.12** | **新品爆发信号（提高）** |
| 年同比 | 0.08 | 过滤衰退品 |
| 父级收入 | 0.06 | 保留参考 |
| ASIN收入 | 0.06 | 保留参考 |
| **评论评分** | **0.10** | 质量口碑核心 |
| 评论数量 | 0.05 | 辅助（不过度压新品） |
| 卖家数 | 0.07 | 适度竞争最优 |
| 年龄（月） | 0.09 | 新品高分，但不过度压老品 |
| 价格趋势 | 0.03 | 辅助信号 |
| **价格带/利润率** | **0.03** | 有 `margin%` 优先用利润率 |
| 尺寸+重量+仓储（合成） | 0.07 | 物流成本因素 |
| 图片数+变体数（合成） | 0.04 | 基础转化信号 |

> 合计 = 1.00

---

## 3) 维度打分（0–100）

> 所有子分最后 `clamp` 到 `[0,100]`。示例公式默认输入为数值型，百分比请用“自然数”表示（如 +38% → `38`）。

### 3.1 ASIN销量 (0.08)
- `asinSales >= 2000 → 100`；否则线性  
  `asinSalesScore = asinSales/2000 * 100`

### 3.2 销量趋势（90天） (0.12)
```ts
if (salesTrend >= 50) score = 100;
else if (salesTrend >= 0) score = 50 + salesTrend;   // 0%→50, 50%→100
else score = max(0, 50 + salesTrend);                // -50%→0
