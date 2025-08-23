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
  imported_at: string | null;
};

export default function ProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [sortKey, setSortKey] = useState<keyof Product | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [draft, setDraft] = useState({
    platformMin: '',
    platformMax: '',
    independentMin: '',
    independentMax: '',
    keyword: '',
    category: '',
  });
  const [filters, setFilters] = useState(draft);

  useEffect(() => {
    async function loadCategories() {
      const res = await fetch('/api/categories').then((r) => r.json());
      setCategories(res.categories || []);
    }
    loadCategories();
  }, []);
  useEffect(() => {
    async function load() {
      const files = await fetch('/api/files').then((r) => r.json());
      if (!Array.isArray(files) || !files.length) return;
      const latest = files[0];
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.set(k, v);
      });
      const res = await fetch(
        `/api/files/${latest.id}/rows?${params.toString()}`
      ).then((r) => r.json());
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
        imported_at: r.imported_at ?? null,
      }));
      setItems(mapped);
      setTotal(res.count || 0);
    }
    load();
  }, [page, limit, filters]);

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
      {sortKey === key && (sortDir === 'asc' ? ' ↑' : ' ↓')}
    </th>
  );

  return (
    <div className="p-6 space-y-4 overflow-auto">
      <h1 className="text-2xl font-semibold">产品列表</h1>
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="block text-xs">平台评分</label>
          <div className="flex gap-1">
            <input
              type="number"
              placeholder="最低"
              className="w-20 border px-1"
              value={draft.platformMin}
              onChange={(e) => setDraft({ ...draft, platformMin: e.target.value })}
            />
            <span>-</span>
            <input
              type="number"
              placeholder="最高"
              className="w-20 border px-1"
              value={draft.platformMax}
              onChange={(e) => setDraft({ ...draft, platformMax: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs">独立站评分</label>
          <div className="flex gap-1">
            <input
              type="number"
              placeholder="最低"
              className="w-20 border px-1"
              value={draft.independentMin}
              onChange={(e) =>
                setDraft({ ...draft, independentMin: e.target.value })
              }
            />
            <span>-</span>
            <input
              type="number"
              placeholder="最高"
              className="w-20 border px-1"
              value={draft.independentMax}
              onChange={(e) =>
                setDraft({ ...draft, independentMax: e.target.value })
              }
            />
          </div>
        </div>
        <div>
          <label className="block text-xs">产品名</label>
          <input
            type="text"
            className="border px-1"
            value={draft.keyword}
            onChange={(e) => setDraft({ ...draft, keyword: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs">类目</label>
          <select
            className="border px-1"
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}
          >
            <option value="">全部</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <button
          className="px-3 py-1 border bg-[var(--muted)]"
          onClick={() => {
            setFilters(draft);
            setPage(1);
          }}
        >
          搜索
        </button>
      </div>
      <div className="flex gap-4">
        <div className="flex-1 overflow-x-auto rounded border border-[var(--border)]">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--muted)]">
              <tr>
              {renderHeader('产品', 'title')}
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
              {renderHeader('录入时间', 'imported_at')}
            </tr>
          </thead>
          <tbody>
            {display.map((p) => (
              <tr
                key={p.id}
                className="border-t border-[var(--border)] hover:bg-[var(--muted)]"
              >
                <td className="p-2 w-40">
                  {p.url ? (
                    <a
                      href={p.url}
                      target="_blank"
                      className="block text-center hover:underline"
                      title={p.title ?? ''}
                    >
                      {p.image_url && (
                        <img
                          src={p.image_url}
                          alt={p.title ?? ''}
                          style={{ width: 150, height: 150 }}
                          className="object-contain mx-auto"
                        />
                      )}
                      <span className="mt-1 block truncate whitespace-nowrap">
                        {p.title || '查看'}
                      </span>
                    </a>
                  ) : (
                    <div className="text-center">
                      {p.image_url && (
                        <img
                          src={p.image_url}
                          alt={p.title ?? ''}
                          style={{ width: 150, height: 150 }}
                          className="object-contain mx-auto"
                        />
                      )}
                      <span className="mt-1 block truncate whitespace-nowrap" title={p.title ?? ''}>
                        {p.title}
                      </span>
                    </div>
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
                <td className="p-2 text-right">
                  {p.imported_at
                    ? new Date(p.imported_at).toLocaleDateString()
                    : '-'}
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
    </div>
    <div className="flex items-center gap-2">
        <button
          className="px-2 py-1 border"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          上一页
        </button>
        <span>
          {page}/{Math.max(1, Math.ceil(total / limit))}
        </span>
        <button
          className="px-2 py-1 border"
          onClick={() =>
            setPage((p) =>
              p < Math.ceil(total / limit) ? p + 1 : p
            )
          }
          disabled={page >= Math.ceil(total / limit)}
        >
          下一页
        </button>
        <select
          className="border px-1"
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
        >
          {[10, 20, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n}/页
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

