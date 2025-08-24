# Product Selection Platform

Initial Next.js project scaffold for product-selection-oversea. See `PROJECT_GUIDE.md` for the full development plan.

## Development

- `npm run dev` – start development server
- `npm run build` – build for production
- `npm run lint` – run eslint

## V4 Scoring Rules

> 目标：强调「新品优先 + 上升趋势 + 利润空间」。本版仅调整评分规则与权重，接口与页面结构保持不变。

### 1) Scoring thresholds

| Total Score | Tier       |
|------------:|------------|
| 85–100      | Excellent  |
| 70–85       | Potential  |
| 55–70       | Average    |
| <55         | Low        |

### 2) Weights

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

### 3) Dimension scoring formulas (0–100)

所有子分最终 `clamp` 到 `[0,100]`，总分为 `totalScore = Σ(weight_i * score_i)`。

#### 3.1 ASIN销量 (0.08)
```ts
if (asinSales >= 2000) score = 100;
else score = asinSales / 2000 * 100;
```

#### 3.2 销量趋势（90天） (0.12)
```ts
if (salesTrend >= 50) score = 100;
else if (salesTrend >= 0) score = 50 + salesTrend;   // 0%→50, 50%→100
else score = Math.max(0, 50 + salesTrend);           // -50%→0
```

#### 3.3 年同比 (0.08)
```ts
if (yoy >= 30) score = 100;
else if (yoy >= 0) score = 70 + yoy;                 // 0%→70, 30%→100
else score = Math.max(0, 70 + yoy);                  // -70%→0
```

#### 3.4 父级收入 (0.06)
```ts
score = Math.min(parentRevenue / 500000 * 100, 100);
```

#### 3.5 ASIN收入 (0.06)
```ts
score = Math.min(asinRevenue / 100000 * 100, 100);
```

#### 3.6 评论评分 (0.10)
```ts
score = rating / 5 * 100;
```

#### 3.7 评论数量 (0.05)
```ts
score = Math.min(reviewCount / 500 * 100, 100);
```

#### 3.8 卖家数 (0.07)
```ts
if (sellerCount <= 3) score = 100;
else if (sellerCount <= 10) score = (10 - sellerCount) / 7 * 100; // 4→85.7
else score = 0;
```

#### 3.9 年龄（月） (0.09)
```ts
if (ageMonths <= 6) score = 100;
else if (ageMonths <= 36) score = (36 - ageMonths) / 30 * 100;
else score = 0;
```

#### 3.10 价格趋势 (0.03)
```ts
score = Math.max(0, 100 - Math.max(priceTrend, 0)); // 价格上涨扣分
```

#### 3.11 价格带/利润率 (0.03)
```ts
if (marginPercent >= 30) score = 100;
else score = Math.max(0, marginPercent / 30 * 100);
```

#### 3.12 尺寸+重量+仓储（合成） (0.07)
```ts
if (logisticsCost <= 3) score = 100;
else if (logisticsCost <= 10) score = (10 - logisticsCost) / 7 * 100;
else score = 0;
```

#### 3.13 图片数+变体数（合成） (0.04)
```ts
const imageScore = Math.min(imageCount / 5 * 70, 70);   // >=5 图满分
const variantScore = variantCount <= 3 ? 30 : Math.max(0, 30 - (variantCount - 3) * 10);
score = imageScore + variantScore;
```

### 4) Backend update

请用以下 V4 评分规则替换原有评分逻辑（原来是 V3），在后端评分引擎里更新，并保证输出 `totalScore`（0–100）和 `tier`（`excellent`/`potential`/`average`/`low`）字段。

