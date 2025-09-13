"use client";

import { useState } from "react";

type Props = {
  product: any;
};

export default function AiReview({ product }: Props) {
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState("");

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product }),
      }).then((r) => r.json());
      setReview(res.review || "暂无点评");
    } catch (e) {
      setReview("AI 点评失败");
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
      {review && (
        <p className="p-2 border text-sm whitespace-pre-line">{review}</p>
      )}
    </div>
  );
}
