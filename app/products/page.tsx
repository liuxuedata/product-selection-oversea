"use client";
import { useEffect, useState } from "react";
import ScoreBadge from "@/components/ScoreBadge";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  title: string;
  url: string;
  image: string;
  asin: string;
  parent_asin: string;
  price: number;
  asin_sales: number;
  review_count: number;
  review_rating: number;
  platform_score: number;
  independent_score: number;
};

export default function ProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: "platform_score" | "price"; order: "asc" | "desc" }>({
    key: "platform_score",
    order: "desc",
  });
  const router = useRouter();

  useEffect(() => {
    fetch("/api/mock/products.json")
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : data.items || []));
  }, []);

  const filtered = items.filter(
    (p) =>
      !q ||
      p.title.toLowerCase().includes(q.toLowerCase()) ||
      p.asin?.toLowerCase().includes(q.toLowerCase())
  );
  const sorted = [...filtered].sort((a, b) =>
    sort.order === "asc" ? a[sort.key] - b[sort.key] : b[sort.key] - a[sort.key]
  );
  const toggleSort = (key: "platform_score" | "price") =>
    setSort((s) => ({ key, order: s.key === key && s.order === "asc" ? "desc" : "asc" }));

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">产品列表</h1>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="搜索标题/ASIN"
        className="border border-[var(--border)] bg-[var(--background)] rounded px-3 py-2 w-full max-w-md"
      />
      <div className="overflow-auto border border-[var(--border)] rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--muted)] sticky top-0">
            <tr>
              <th className="p-3 text-left">产品</th>
              <th className="p-3 text-left">ASIN</th>
              <th className="p-3 text-right cursor-pointer" onClick={() => toggleSort("price")}>
                价格
              </th>
              <th className="p-3 text-right">销量(ASIN)</th>
              <th className="p-3 text-right">评论(数/分)</th>
              <th className="p-3 text-left cursor-pointer" onClick={() => toggleSort("platform_score")}>平台分</th>
              <th className="p-3 text-left">独立站分</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr
                key={p.id}
                className="border-t border-[var(--border)] hover:bg-[var(--surface-hover)] cursor-pointer"
                onClick={() => router.push(`/products/${p.id}`)}
              >
                <td className="p-3 flex items-center gap-3">
                  <img src={p.image} alt="" className="w-10 h-10 rounded object-cover" />
                  <a
                    href={p.url}
                    onClick={(e) => e.stopPropagation()}
                    className="underline"
                    target="_blank"
                  >
                    {p.title}
                  </a>
                </td>
                <td className="p-3">{p.asin}</td>
                <td className="p-3 text-right">{p.price?.toFixed?.(2)}</td>
                <td className="p-3 text-right">{p.asin_sales ?? "-"}</td>
                <td className="p-3 text-right">
                  {p.review_count ?? 0} / {p.review_rating ?? "-"}
                </td>
                <td className="p-3">
                  <ScoreBadge value={p.platform_score} />
                </td>
                <td className="p-3">
                  <ScoreBadge value={p.independent_score} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
