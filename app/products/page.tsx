"use client";
import { useEffect, useState } from "react";
import ScoreBadge from "@/components/ScoreBadge";
import { SCORE_TIERS } from "@/utils/score";

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
  const [sortKey, setSortKey] = useState<keyof Product | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    async function load() {
      const files = await fetch("/api/files").then((r) => r.json());
      if (!Array.isArray(files) || !files.length) return;
      const latest = files[0];
      const res = await fetch(`/api/files/${latest.id}/rows?limit=1000`).then((r) =>
        r.json()
      );
      const rows = res.rows || [];
      console.log('fetched rows', rows.length);
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
      const filtered = mapped.filter(
        (p) =>
          Math.max(p.platform_score ?? 0, p.independent_score ?? 0) <
          SCORE_TIERS.MIN
      );
      console.log('products after filter', filtered.length);
      setItems(filtered);
    }
    load();
  }, []);

  function handleSort(key: keyof Product) {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const display = [...items];
  if (sortKey) {
    display.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va;
      }
      const sa = String(va);
      const sb = String(vb);
      if (sa < sb) return sortDir === 'asc' ? -1 : 1;
      if (sa > sb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const renderHeader = (
    label: string,
    key: keyof Product,
    align: string = 'text-left'
  ) => (
    <th
      key={String(key)}
      className={`p-2 ${align} cursor-pointer select-none`}
      onClick={() => handleSort(key)}
    >
      {label}
    </th>
  );

  return (
    <div className="p-6 space-y-4 overflow-auto">
      <h1 className="text-2xl font-semibold">产品列表</h1>
      <table className="min-w-full text-sm border border-[var(--border)]">
        <thead className="bg-[var(--muted)]">
          <tr>
            {renderHeader('图片', 'image_url')}
            {renderHeader('标题', 'title')}
            {renderHeader('ASIN', 'asin')}
            {renderHeader('品牌', 'brand')}
            {renderHeader('配送方式', 'shipping')}
            {renderHeader('类目', 'category')}
            {renderHeader('价格', 'price', 'text-right')}
            {renderHeader('评论数量', 'review_count', 'text-right')}
            {renderHeader('评论评分', 'review_rating', 'text-right')}
            {renderHeader('第三方卖家', 'third_party_seller')}
            {renderHeader('卖家国家/地区', 'seller_country')}
            {renderHeader('活跃卖家数量', 'active_seller_count', 'text-right')}
            {renderHeader('尺寸分级', 'size_tier')}
            {renderHeader('长度', 'length', 'text-right')}
            {renderHeader('宽度', 'width', 'text-right')}
            {renderHeader('高度', 'height', 'text-right')}
            {renderHeader('重量', 'weight', 'text-right')}
            {renderHeader('年龄（月）', 'age_months', 'text-right')}
            {renderHeader('平台评分', 'platform_score')}
            {renderHeader('独立站评分', 'independent_score')}
          </tr>
        </thead>
        <tbody>
          {display.map((p) => (
            <tr key={p.id} className="border-t border-[var(--border)]">
              <td className="p-2">
                {p.image_url && (
                  <img
                    src={p.image_url}
                    alt={p.title ?? ''}
                    className="w-16 h-auto"
                  />
                )}
              </td>
              <td className="p-2">
                {p.url ? (
                  <a href={p.url} target="_blank" className="underline">
                    {p.title || '查看'}
                  </a>
                ) : (
                  p.title
                )}
              </td>
              <td className="p-2">{p.asin}</td>
              <td className="p-2">{p.brand}</td>
              <td className="p-2">{p.shipping}</td>
              <td className="p-2">{p.category}</td>
              <td className="p-2 text-right">{p.price ?? '-'}</td>
              <td className="p-2 text-right">{p.review_count ?? '-'}</td>
              <td className="p-2 text-right">{p.review_rating ?? '-'}</td>
              <td className="p-2">{p.third_party_seller}</td>
              <td className="p-2">{p.seller_country}</td>
              <td className="p-2 text-right">{p.active_seller_count ?? '-'}</td>
              <td className="p-2">{p.size_tier}</td>
              <td className="p-2 text-right">{p.length ?? '-'}</td>
              <td className="p-2 text-right">{p.width ?? '-'}</td>
              <td className="p-2 text-right">{p.height ?? '-'}</td>
              <td className="p-2 text-right">{p.weight ?? '-'}</td>
              <td className="p-2 text-right">{p.age_months ?? '-'}</td>
              <td className="p-2">
                <ScoreBadge value={p.platform_score ?? 0} />
              </td>
              <td className="p-2">
                <ScoreBadge value={p.independent_score ?? 0} />
              </td>
            </tr>
          ))}
          {!display.length && (
            <tr>
              <td className="p-2 text-center" colSpan={20}>
                暂无数据
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

