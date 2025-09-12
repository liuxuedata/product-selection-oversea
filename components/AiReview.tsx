'use client';
import { useState } from 'react';

export default function AiReview({ product }: { product: any }) {
  const [comment, setComment] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const apiKey =
        typeof window !== 'undefined' ? localStorage.getItem('ai_api_key') : '';
      const apiBase =
        typeof window !== 'undefined' ? localStorage.getItem('ai_api_base') : '';
      const res = await fetch('/api/ai-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, apiKey, apiBase }),
      });
      const data = await res.json();
      setComment(data.comment);
    } catch (e) {
      setComment('AI 生成失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-[var(--border)] rounded p-4">
      <h2 className="font-semibold mb-3">AI 点评</h2>
      {comment ? (
        <p className="text-sm whitespace-pre-line">{comment}</p>
      ) : (
        <button
          onClick={handleClick}
          disabled={loading}
          className="px-3 py-1 rounded bg-blue-500 text-white text-sm disabled:opacity-50"
        >
          {loading ? '生成中…' : '生成 AI 推荐'}
        </button>
      )}
    </div>
  );
}
