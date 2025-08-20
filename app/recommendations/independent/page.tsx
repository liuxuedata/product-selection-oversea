"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import ScoreBadge from "@/components/ScoreBadge";
import { SCORE_TIERS } from "@/utils/score";

type Product = {
  id: string;
  title: string;
  image: string;
  url: string;
  independent_score: number;
};

export default function IndependentRecommendationsPage() {
  const [items, setItems] = useState<Product[]>([]);
  useEffect(() => {
    fetch("/api/mock/products.json")
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : data.items || []));
  }, []);
  const list = items
    .filter((p) => (p.independent_score ?? 0) >= SCORE_TIERS.MIN)
    .sort((a, b) => b.independent_score - a.independent_score);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">独立站推荐</h2>
      <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((p) => (
          <li
            key={p.id}
            className="border border-[var(--border)] rounded p-4 flex gap-3 bg-[var(--background)]"
          >
            <img src={p.image} className="w-16 h-16 rounded object-cover" />
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <Link href={`/products/${p.id}`} className="font-medium underline">
                  {p.title}
                </Link>
                <ScoreBadge value={p.independent_score} />
              </div>
              <a
                href={p.url}
                target="_blank"
                className="text-xs underline text-[var(--muted-foreground)]"
              >
                原始链接
              </a>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
