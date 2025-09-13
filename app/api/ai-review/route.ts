import { NextResponse } from "next/server";
import { providers, defaultProvider } from "@/lib/ai/providers";

export async function POST(req: Request) {
  const { product, provider = defaultProvider, model } = await req.json();
  const cfg = providers[provider];
  if (!cfg || !cfg.apiKey) {
    return NextResponse.json(
      { error: "AI provider not configured" },
      { status: 500 }
    );
  }
  const finalModel = model || cfg.models[0];

  const prompt = `请作为选品专家点评并推荐以下产品:\n${JSON.stringify(
    product,
    null,
    2
  )}`;

  try {
    const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: finalModel,
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
