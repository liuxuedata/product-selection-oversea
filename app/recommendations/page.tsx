"use client";
import { useEffect, useState } from "react";
import ScoreBadge from "@/components/ScoreBadge";
import { SCORE_TIERS } from "@/utils/score";
import Link from "next/link";

type Product = { id:string; title:string; image:string; score:number; url:string };

export default function RecommendationsPage() {
  const [items, setItems] = useState<Product[]>([]);
  useEffect(() => { fetch("/api/mock/products.json").then(r=>r.json()).then(setItems); }, []);
  const rec = items.filter(p => (p.score ?? 0) >= SCORE_TIERS.MIN).sort((a,b)=> (b.score - a.score));

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">推荐产品（≥55）</h1>
      <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rec.map(p => (
          <li key={p.id} className="border rounded p-4 flex gap-3">
            <img src={p.image} className="w-16 h-16 rounded object-cover" />
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <Link href={`/products/${p.id}`} className="font-medium underline">{p.title}</Link>
                <ScoreBadge value={p.score} />
              </div>
              <a href={p.url} target="_blank" className="text-xs text-gray-500 underline">原始链接</a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
