import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { product } = await req.json();
  const apiKey = process.env.AI_API_KEY;
  const apiBase = process.env.AI_API_BASE || "https://api.openai.com/v1";
  const model = process.env.AI_MODEL || "gpt-5.0";

  if (!apiKey) {
    return NextResponse.json(
      { error: "AI_API_KEY not configured" },
      { status: 500 }
    );
  }

  const prompt = `请作为选品专家点评并推荐以下产品:\n${JSON.stringify(
    product,
    null,
    2
  )}`;

  try {
    const res = await fetch(`${apiBase}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "你是一位选品专家，提供点评和推荐。" },
          { role: "user", content: prompt },
        ],
      }),
    });
    const data = await res.json();
    const review = data?.choices?.[0]?.message?.content || "无法获取点评";
    return NextResponse.json({ review });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "AI review failed" },
      { status: 500 }
    );
  }
}
