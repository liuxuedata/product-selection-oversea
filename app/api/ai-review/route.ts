import { NextResponse } from "next/server";
import { providers } from "@/lib/ai/providers";

export async function POST(req: Request) {
  const { product, provider: providerKey = "openai", model } = await req.json();
  const provider = providers[providerKey];

  if (!provider || !provider.apiKey) {
    return NextResponse.json(
      { error: "AI provider not configured" },
      { status: 500 }
    );
  }

  const modelName = model || provider.models[0];
  const prompt = `作为一位资深的跨境电商选品专家，请对以下产品进行专业分析：

产品信息：
- 产品标题：${product.title || '未知'}
- ASIN：${product.asin || '未知'}
- 价格：$${product.price || '未知'}
- 评分：${product.review_rating || '未知'} (${product.review_count || 0} 条评论)
- 销量：${product.asin_sales || '未知'}
- 卖家数：${product.third_party_seller || '未知'}
- 平台评分：${product.platform_score || '未知'}
- 独立站评分：${product.independent_score || '未知'}

请从以下维度进行专业分析：

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

请用专业、客观的语言进行分析，并提供可操作的建议。`;

  try {
    const res = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { 
            role: "system", 
            content: "你是一位拥有10年跨境电商经验的资深选品专家，擅长分析亚马逊、独立站等平台的选品策略。你的分析专业、客观、实用，能够为卖家提供有价值的选品建议和风险评估。" 
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message || res.statusText },
        { status: res.status }
      );
    }

    const review = data?.choices?.[0]?.message?.content || "无法获取点评";
    return NextResponse.json({ review });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "AI review failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
