"use client";

import { useState, useEffect } from "react";

type Props = {
  product: any;
};

export default function AiReview({ product }: Props) {
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState("");
  const [error, setError] = useState("");
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("");

  useEffect(() => {
    const p = localStorage.getItem("ai_provider");
    const m = localStorage.getItem("ai_model");
    if (p) setProvider(p);
    if (m) setModel(m);
  }, []);

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, provider, model }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setReview("");
      } else {
        setReview(data.review || "暂无点评");
        setError("");
      }
    } catch (e) {
      setError("AI 点评失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        className="border px-2 py-1 rounded hover:bg-[var(--muted)]"
        onClick={handleGenerate}
        disabled={loading}
      >
        {loading ? "AI 生成中..." : "生成 AI 点评"}
      </button>
      {error && <p className="p-2 border text-sm text-red-600">{error}</p>}
      {review && (
        <p className="p-2 border text-sm whitespace-pre-line">{review}</p>
      )}
    </div>
  );
}
