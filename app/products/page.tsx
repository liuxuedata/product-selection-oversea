"use client";
import { useEffect, useState } from "react";
import ScoreBadge from "@/components/ScoreBadge";

type Product = {
  id: string;
  url: string | null;
  image_url: string | null;
  asin: string | null;
  title: string | null;
  brand: string | null;
  shipping: string | null;
  category: string | null;
  price: number | null;
  review_count: number | null;
  review_rating: number | null;
  third_party_seller: string | null;
  seller_country: string | null;
  active_seller_count: number | null;
  size_tier: string | null;
  length: number | null;
  width: number | null;
  height: number | null;
  weight: number | null;
  age_months: number | null;
  platform_score: number | null;
  independent_score: number | null;
};

export default function ProductsPage() {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/products?limit=100`).then((r) => r.json());
      const rows = res.rows || [];
      const mapped: Product[] = rows.map((r: any) => ({
        id: r.row_id,
        url: r.url ?? null,
        image_url: r.image_url ?? null,
        asin: r.asin ?? null,
        title: r.title ?? null,
        brand: r.brand ?? null,
        shipping: r.shipping ?? null,
        category: r.category ?? null,
        price: r.price ?? null,
        review_count: r.review_count ?? null,
        review_rating: r.review_rating ?? null,
        third_party_seller: r.third_party_seller ?? null,
        seller_country: r.seller_country ?? null,
        active_seller_count: r.active_seller_count ?? null,
        size_tier: r.size_tier ?? null,
        length: r.length ?? null,
        width: r.width ?? null,
        height: r.height ?? null,
        weight: r.weight ?? null,
        age_months: r.age_months ?? null,
        platform_score: r.platform_score ?? null,
        independent_score: r.independent_score ?? null,
      }));
      setItems(mapped);
    }
    load();
  }, []);

  return (
    <div className="p-6 space-y-4 overflow-auto">
      <h1 className="text-2xl font-semibold">产品列表</h1>
      <table className="min-w-full text-sm border border-[var(--border)]">
        <thead className="bg-[var(--muted)]">
          <tr>
            <th className="p-2 text-left">URL</th>
            <th className="p-2 text-left">图片 URL</th>
            <th className="p-2 text-left">ASIN</th>
            <th className="p-2 text-left">标题</th>
            <th className="p-2 text-left">品牌</th>
            <th className="p-2 text-left">配送方式</th>
            <th className="p-2 text-left">类目</th>
            <th className="p-2 text-right">价格</th>
            <th className="p-2 text-right">评论数量</th>
            <th className="p-2 text-right">评论评分</th>
            <th className="p-2 text-left">第三方卖家</th>
            <th className="p-2 text-left">卖家国家/地区</th>
            <th className="p-2 text-right">活跃卖家数量</th>
            <th className="p-2 text-left">尺寸分级</th>
            <th className="p-2 text-right">长度</th>
            <th className="p-2 text-right">宽度</th>
            <th className="p-2 text-right">高度</th>
            <th className="p-2 text-right">重量</th>
            <th className="p-2 text-right">年龄（月）</th>
            <th className="p-2 text-left">平台评分</th>
            <th className="p-2 text-left">独立站评分</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.id} className="border-t border-[var(--border)]">
              <td className="p-2">
                {p.url && (
                  <a href={p.url} target="_blank" className="underline">
                    链接
                  </a>
                )}
              </td>
              <td className="p-2">
                {p.image_url && (
                  <a href={p.image_url} target="_blank" className="underline">
                    图片
                  </a>
                )}
              </td>
              <td className="p-2">{p.asin}</td>
              <td className="p-2">{p.title}</td>
              <td className="p-2">{p.brand}</td>
              <td className="p-2">{p.shipping}</td>
              <td className="p-2">{p.category}</td>
              <td className="p-2 text-right">{p.price ?? "-"}</td>
              <td className="p-2 text-right">{p.review_count ?? "-"}</td>
              <td className="p-2 text-right">{p.review_rating ?? "-"}</td>
              <td className="p-2">{p.third_party_seller}</td>
              <td className="p-2">{p.seller_country}</td>
              <td className="p-2 text-right">{p.active_seller_count ?? "-"}</td>
              <td className="p-2">{p.size_tier}</td>
              <td className="p-2 text-right">{p.length ?? "-"}</td>
              <td className="p-2 text-right">{p.width ?? "-"}</td>
              <td className="p-2 text-right">{p.height ?? "-"}</td>
              <td className="p-2 text-right">{p.weight ?? "-"}</td>
              <td className="p-2 text-right">{p.age_months ?? "-"}</td>
              <td className="p-2">
                <ScoreBadge value={p.platform_score ?? 0} />
              </td>
              <td className="p-2">
                <ScoreBadge value={p.independent_score ?? 0} />
              </td>
            </tr>
          ))}
          {!items.length && (
            <tr>
              <td className="p-2 text-center" colSpan={21}>
                暂无数据
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
