"use client";
import { useEffect, useState } from "react";
import ScoreBadge from "@/components/ScoreBadge";
import { SCORE_TIERS } from "@/utils/score";

type Product = {
  id: string;
  url: string | null;
  image: string | null;
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
  size: string | null;
  length: number | null;
  width: number | null;
  height: number | null;
  weight: number | null;
  age_months: number | null;
  platform_score: number | null;
  independent_score: number | null;
};

function pick(obj: any, keys: string[]): any {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return null;
}

export default function ProductsPage() {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    async function load() {
      const files = await fetch("/api/files").then((r) => r.json());
      if (!Array.isArray(files) || !files.length) return;
      const latest = files[0];
      const res = await fetch(`/api/files/${latest.id}/rows?limit=1000`).then((r) =>
        r.json()
      );
      const rows = res.rows || [];
      const mapped: Product[] = rows.map((r: any) => {
        const d = r.data || {};
        return {
          id: r.row_id,
          url: r.url ?? null,
          image: pick(d, ["图片 URL", "Image URL", "image"]),
          asin: r.asin ?? null,
          title: r.title ?? null,
          brand: pick(d, ["品牌", "Brand"]),
          shipping: pick(d, ["配送方式", "Shipping"]),
          category: pick(d, ["类目", "Category"]),
          price: pick(d, ["价格", "Price"]),
          review_count: pick(d, ["评论数量", "Review Count"]),
          review_rating: pick(d, ["评论评分", "Review Rating"]),
          third_party_seller: pick(d, ["第三方卖家", "Third Party Seller"]),
          seller_country: pick(d, ["卖家国家/地区", "Seller Country"]),
          active_seller_count: pick(d, ["活跃卖家数量", "Active Sellers"]),
          size: pick(d, ["尺寸分级", "Size"]),
          length: pick(d, ["长度", "Length"]),
          width: pick(d, ["宽度", "Width"]),
          height: pick(d, ["高度", "Height"]),
          weight: pick(d, ["重量", "Weight"]),
          age_months: pick(d, ["年龄（月）", "Age (Months)"]),
          platform_score: r.platform_score ?? null,
          independent_score: r.independent_score ?? null,
        };
      });
      const filtered = mapped.filter(
        (p) =>
          Math.max(p.platform_score ?? 0, p.independent_score ?? 0) <
          SCORE_TIERS.MIN
      );
      setItems(filtered);
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
                {p.image && (
                  <a href={p.image} target="_blank" className="underline">
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
              <td className="p-2">{p.size}</td>
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

