# Google Trends 模块集成指南（PROJECT_GUIDE_Trends.md）

> 目标：在“选品平台”内新增 Google Trends 趋势可视化、筛选与评分加权，兼容现有评分脚本与归集流程（≥55 分入池、70/85 阈值颜色标记）。

---

## 1. 交付物（Definition of Done）
- [ ] 列表页新增筛选：区间（7D/90D/12M/5Y）、地区（Global/US/DE/FR/JP/BR/SG…）、条件（Slope>、Avg≥、Seasonality≤）。
- [ ] 产品卡与详情页显示趋势折线图；徽标“上行/平/下行”。
- [ ] `/api/trends` 可批量拉取关键词趋势并返回**时间序列 + 派生指标**。
- [ ] Apps Script（可选）将 `TrendAvg_12M / TrendSlope_90D / Seasonality_12M / TrendFlag` 写回数据表供评分与归集使用。
- [ ] 评分规则新增“趋势分模块”（总权重 0.08，默认上线；可通过 env 开关）。
- [ ] 文档与测试通过，PR 合并；列表页可按 Slope/Avg 排序；≥70、≥85 阈值颜色不受影响。

---

## 2. 指标定义（用于筛选与评分）
- **TrendAvg(t)**：区间内平均热度（0–100 均值）。
- **TrendSlope(t)**：区间线性斜率（最小二乘法，>0 视为上行）。
- **Seasonality12m**：12 个月波动度 = `std/mean`（越小越稳）。

默认区间：90D（筛选用）与 12M（基准热度与季节性）。

---

## 3. 代码结构与文件位置
```
root/
├─ app/ 或 pages/
│  ├─ api/
│  │  └─ trends.ts               # Vercel 无服务器函数（下节提供完整实现）
│  ├─ components/
│  │  ├─ TrendPanel.tsx          # 单产品趋势卡片（折线 + 指标徽标）
│  │  └─ TrendFilters.tsx        # 列表筛选器（区间/地区/条件）
│  ├─ (your list page).tsx       # 列表页集成筛选与排序
│  └─ (your detail page).tsx     # 详情页嵌入 TrendPanel
├─ lib/
│  └─ trends-metrics.ts          # 指标计算工具（回归、季节性）
├─ scripts/
│  └─ apps-script/refreshTrends.gs # 写回表格，可选
└─ .env / vercel env              # 开关与限流配置
```

---

## 4. 服务端：`/api/trends`（Vercel 无服务器函数）
**依赖**：`npm i google-trends-api`

**功能**：接受 `keywords`（单个/逗号分隔）、`geo`（''=Global）、`timeframe`（`now 7-d|today 3-m|today 12-m|today 5-y`），返回每个关键词的时间序列+衍生指标（avg/slope），并带缓存 headers。

```ts
// app/api/trends/route.ts (Next.js 13+ app router) 或 pages/api/trends.ts (pages router)
import type { NextRequest } from 'next/server';
import trends from 'google-trends-api';

function deriveMetrics(points: { t:number; v:number }[]) {
  if (!points.length) return { avg: 0, slope: 0 };
  const avg = points.reduce((s,p)=>s+p.v,0) / points.length;
  const n = points.length;
  const sumX = (n*(n-1))/2;
  const sumY = points.reduce((s,p)=>s+p.v,0);
  const sumXY = points.reduce((s,p,i)=>s + i*p.v, 0);
  const sumXX = (n*(n-1)*(2*n-1))/6;
  const denom = Math.max(1, n*sumXX - sumX*sumX);
  const slope = (n*sumXY - sumX*sumY) / denom;
  return { avg, slope };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const geo = searchParams.get('geo') ?? '';
    const timeframe = searchParams.get('timeframe') ?? 'today 12-m';
    const rawKw = searchParams.get('keywords') ?? '';
    const arr = rawKw.split(',').map(s=>s.trim()).filter(Boolean);
    if (!arr.length) return new Response(JSON.stringify({ error: 'keywords required' }), { status: 400 });

    const results = await Promise.all(arr.map(async (kw) => {
      const raw = await trends.interestOverTime({ keyword: kw, geo, timeframe });
      const data = JSON.parse(raw);
      const series = (data?.default?.timelineData || []).map((d:any)=>({
        t: Number(d.time)*1000,
        v: Number(d.value?.[0] || 0)
      }));
      const m = deriveMetrics(series);
      return { keyword: kw, geo: geo || 'GLOBAL', timeframe, series, metrics: { avg: m.avg, slope: m.slope } };
    }));

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=600' }
    });
  } catch (e:any) {
    return new Response(JSON.stringify({ error: e?.message || 'trends error' }), { status: 500 });
  }
}
```

> 可选：若遇到地区/网络限制，可在该路由内增加代理出站或切换至 Edge 函数 + KV 缓存（保留接口签名不变）。

---

## 5. 前端组件
### 5.1 `TrendPanel.tsx`
- 属性：`keyword: string`、`defaultGeo?: string`、`defaultTf?: string`。
- 行为：请求 `/api/trends`，渲染折线图（Chart.js 或 Recharts），角标展示 `Avg` 与 `Slope`；`Slope>0` 显示“上行”。

```tsx
import { useEffect, useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

export default function TrendPanel({ keyword, defaultGeo = '', defaultTf = 'today 12-m' }: { keyword:string; defaultGeo?:string; defaultTf?:string; }){
  const [geo, setGeo] = useState(defaultGeo);
  const [tf, setTf] = useState(defaultTf);
  const [resp, setResp] = useState<any>(null);

  useEffect(()=>{
    const url = `/api/trends?keywords=${encodeURIComponent(keyword)}&geo=${geo}&timeframe=${encodeURIComponent(tf)}`;
    fetch(url).then(r=>r.json()).then(setResp).catch(()=>setResp(null));
  }, [keyword, geo, tf]);

  const series = resp?.results?.[0]?.series || [];
  const line = useMemo(()=>({
    labels: series.map((p:any)=> new Date(p.t).toLocaleDateString()),
    datasets: [{ label: `${keyword} (${geo||'GLOBAL'})`, data: series.map((p:any)=>p.v) }]
  }), [series, keyword, geo]);

  const avg = Math.round(resp?.results?.[0]?.metrics?.avg || 0);
  const slope = Number((resp?.results?.[0]?.metrics?.slope || 0).toFixed(3));

  return (
    <div className="rounded-2xl shadow p-4 bg-white space-y-3">
      <div className="flex items-center gap-2">
        <select className="border rounded px-2 py-1" value={geo} onChange={e=>setGeo(e.target.value)}>
          <option value="">Global</option><option value="US">US</option><option value="DE">DE</option>
          <option value="FR">FR</option><option value="JP">JP</option><option value="BR">BR</option><option value="SG">SG</option>
        </select>
        <select className="border rounded px-2 py-1" value={tf} onChange={e=>setTf(e.target.value)}>
          <option value="now 7-d">7D</option>
          <option value="today 3-m">90D</option>
          <option value="today 12-m">12M</option>
          <option value="today 5-y">5Y</option>
        </select>
        <div className={`ml-auto text-sm px-2 py-1 rounded ${slope>0 ? 'bg-green-100 text-green-700':'bg-gray-100 text-gray-600'}`}>
          {slope>0 ? '上行' : '平/下行'} · Avg {avg}
        </div>
      </div>
      <Line data={line} />
    </div>
  );
}
```

### 5.2 `TrendFilters.tsx`
- 输出：父级列表页可读的筛选条件（`geo`、`timeframe`、阈值对象）。
- 列表页拿到筛选条件后，对已加载的产品关键词**批量请求** `/api/trends`，在内存中过滤/排序。

---

## 6. 与现有评分/归集衔接
### 6.1 表格新增列（如采用表格为中心）
在主表（如 `blackboximport`）末尾追加四列：
- `TrendAvg_12M`
- `TrendSlope_90D`
- `Seasonality_12M`
- `TrendFlag`（当 `Slope>0 && Avg≥40` 时为 `UP`）

### 6.2 Apps Script（可选写回）
`scripts/apps-script/refreshTrends.gs`：
```js
function refreshTrendsForSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('blackboximport');
  var data = sh.getDataRange().getValues();
  var header = data[0];
  var kwCol = header.indexOf('Keyword');
  if (kwCol < 0) throw new Error('未找到 Keyword 列');

  // 追加 4 列头
  var want = ['TrendAvg_12M','TrendSlope_90D','Seasonality_12M','TrendFlag'];
  want.forEach((name,i)=>{ if (header.indexOf(name) < 0) sh.getRange(1, header.length + 1 + i).setValue(name); });

  var lastCol = sh.getLastColumn();
  var startRow = 2, batch = [], step = 20;
  for (var r=startRow; r<=sh.getLastRow(); r++) {
    var kw = sh.getRange(r, kwCol+1).getValue();
    if (kw) batch.push({ row:r, kw });
    if (batch.length>=step || r===sh.getLastRow()) {
      var url = 'https://<your-vercel-app>.vercel.app/api/trends?timeframe=today%2012-m&keywords=' + encodeURIComponent(batch.map(b=>b.kw).join(','));
      var resp = UrlFetchApp.fetch(url, { muteHttpExceptions:true });
      var json = JSON.parse(resp.getContentText());
      var map = {}; (json.results||[]).forEach(it => map[it.keyword] = it);
      batch.forEach(b => {
        var it = map[b.kw];
        var avg = it ? Math.round(it.metrics.avg) : '';
        var slope = it ? Number(it.metrics.slope).toFixed(3) : '';
        var seas = ''; // 可选：在服务端增加季节性计算并返回
        var flag = (Number(slope)>0 && Number(avg)>=40) ? 'UP' : '';
        sh.getRange(b.row, lastCol+1, 1, 4).setValues([[avg, slope, seas, flag]]);
      });
      batch = []; Utilities.sleep(800);
    }
  }
}
```

### 6.3 评分加权（默认权重 0.08）
将趋势分模块合并到 **V3**：
- `TrendMomentum = clip01(sigmoid(Slope90D))` → 0.06
- `SeasonalityPenalty = 1 - clip01(Seasonality12m/0.6)` → 0.01
- `BaselineDemand = clip01(Avg12M/60)` → 0.01

> 开关：`SCORING_ENABLE_TRENDS=true|false`（.env / vercel env）。若关闭则不参与总分。

---

## 7. 环境变量与限流
- `SCORING_ENABLE_TRENDS`：是否纳入评分。
- `TRENDS_MAX_BATCH=20`：前端批量聚合上限。
- 建议在 `/api/trends` 对单 IP/分钟做轻量限流（如内存或 KV），避免触发外部接口限制。

---

## 8. UI/交互规范
- 徽标：
  - `UP`（绿）：`Slope(90D)>0 && Avg(12M)≥40`
  - `SEASONAL`（蓝）：`Seasonality12m ≤ 0.35`（稳）或 `≥0.8`（强季节性，库存提示）
- 列表排序：新增 `按 TrendSlope(90D)`、`按 TrendAvg(12M)`。
- 不改变你现有的 55/70/85 阈值颜色逻辑，仅增加额外角标与排序选项。

---

## 9. 提交流程（建议）
1. 新建分支：`feat/trends-module`。
2. 按第 3–6 节落文件与实现，env 设置 `SCORING_ENABLE_TRENDS=true`。
3. 自测清单（见下节）通过后发 PR，引用 `.github/pull_request_template.md`。
4. 合并后在 Vercel 上检查 Edge/Region、缓存命中与前端交互；如需，增加 edge-config/KV 缓存。

---

## 10. 测试用例与验收
- **接口**：
  - GET `/api/trends?keywords=robot%20vacuum&geo=&timeframe=today%2012-m` → 200，返回 series>0，avg∈[0,100]，slope 数值。
  - 批量：`keywords=a,b,c` 返回数组长度=3，顺序与请求一致。
- **前端**：
  - 切换 Geo/区间能重新渲染；无数据时 graceful fallback（显示“暂无趋势”）。
  - 列表按 Slope/Avg 排序正确；筛选阈值对可见集合生效。
- **表格写回（可选）**：
  - 追加 4 列并写入有效值；`TrendFlag` 按规则标注 `UP`。
- **评分**：
  - 开关关闭时总分不变；开启后“明显上行 + 稳定 + 基本热度≥60”的样本存在轻微加分（不应压过销量/评价维度）。

---

## 11. 备忘与风控
- Google Trends 数据为相对指标（0–100），**跨关键词不可直接比较**绝对量级，仅用于**同一关键词的时间维度**对比；我们的加权权重因此控制在 0.08。
- 若外部依赖在部分地区受限：
  - 方案 A：Vercel 函数配置到可访问 Region；
  - 方案 B：离线定时拉取并缓存到数据库/表格，由前端直接读缓存。
- 前端需做请求去抖与批量聚合；接口返回建议 1h 缓存（s-maxage）。

---

## 12. 示例提交信息（Commit Message）
```
feat(trends): add Google Trends API route, UI panels, list filters and scoring toggle
- /api/trends: batch keywords, avg/slope metrics, cache headers
- TrendPanel/TrendFilters: chart, geo/timeframe controls, badges
- Apps Script (optional): write back TrendAvg_12M/Slope_90D/Seasonality/Flag
- scoring: optional 0.08 trend weight with env toggle
```

---

## 13. 回滚策略
- 关闭 `SCORING_ENABLE_TRENDS` 环境变量，前端隐藏筛选入口；保留 `/api/trends` 供后续复用。
- 若接口不可用，前端降级为“隐藏趋势区域 + 禁用趋势筛选按钮”。

---

### 附：季节性计算（可放 server/lib 或前端）
```ts
export function seasonalityStdOverMean(values:number[]) {
  if (!values.length) return null;
  const mean = values.reduce((s,v)=>s+v,0)/values.length;
  if (!mean) return null;
  const variance = values.reduce((s,v)=>s+(v-mean)**2,0)/values.length;
  return Math.sqrt(variance) / mean; // std/mean
}
```

> 建议在 `/api/trends` 返回 12 个月序列时顺便计算 `seasonality_12m` 一并返回，以减轻前端/Apps Script 的负担。

