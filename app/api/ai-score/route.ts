import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { product, apiKey: bodyKey, apiBase: bodyBase } = await req.json();
  const apiKey = bodyKey || process.env.AI_API_KEY;
  const apiBase = bodyBase || process.env.AI_API_BASE || 'https://api.openai.com/v1';

  if (!apiKey) {
    return NextResponse.json({ error: 'missing api key' }, { status: 400 });
  }

  const prompt = `请作为资深选品专家点评以下产品并给出推荐建议。\n\n${JSON.stringify(
    product,
    null,
    2
  )}`;

  const resp = await fetch(`${apiBase}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-5',
      messages: [
        { role: 'system', content: '你是资深的跨境电商选品专家。' },
        { role: 'user', content: prompt },
      ],
    }),
  });

  const data = await resp.json();
  const comment = data.choices?.[0]?.message?.content?.trim() || '';
  return NextResponse.json({ comment });
}
