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

export default function RecommendationsPage() {
  const [all, setAll] = useState<Product[]>([]);
  const [items, setItems] = useState<Product[]>([]);
  const [sortKey, setSortKey] = useState<keyof Product | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [draft, setDraft] = useState({ keyword: '', category: '' });
  const [filters, setFilters] = useState(draft);
  const [status, setStatus] = useState<'loading' | 'loaded'>('loading');

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/categories').then((r) => r.json());
        if (Array.isArray(res.categories) && res.categories.length) {
          setCategories(res.categories);
        }
      } catch (err) {
        console.error('fetch categories failed', err);
      }
    }
    loadCategories();
  }, []);

  useEffect(() => {
    async function load() {
      try {
        setStatus('loading');
        const res = await fetch('/api/products/latest?recommend=1').then((r) => r.json());
        const rows = res.items || [];
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
        setAll(mapped);
        if (!categories.length) {
          const unique = Array.from(
            new Set(
              mapped
                .map((p) => p.category)
                .filter((c): c is string => Boolean(c))
            )
          );
          setCategories(unique);
        }
      } catch (err) {
        console.error('fetch latest failed', err);
      } finally {
        setStatus('loaded');
      }
    }
    load();
  }, []);

  useEffect(() => {
    const filtered = all.filter((p) => {
      if (filters.keyword && !(p.title ?? '').includes(filters.keyword)) return false;
      if (filters.category && p.category !== filters.category) return false;
      return true;
    });
    const start = (page - 1) * limit;
    setItems(filtered.slice(start, start + limit));
    setTotal(filtered.length);
  }, [all, page, limit, filters]);

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
      <h1 className="text-2xl font-semibold">推荐产品</h1>
      <div className="text-sm text-gray-500">
        {status === 'loading' ? '加载中，请等待...' : '加载完成'}
      </div>
      <div className="flex flex-wrap items-end gap-2">
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
          className="border px-3 py-1"
          onClick={() => {
            setPage(1);
            setFilters(draft);
          }}
        >
          搜索
        </button>
      </div>

      <table className="min-w-full border border-[var(--border)] text-sm">
        <thead className="bg-[var(--muted)]">
          <tr>
            {renderHeader('产品', 'title')}
            {renderHeader('ASIN', 'asin')}
            {renderHeader('品牌', 'brand')}
            {renderHeader('发货方式', 'shipping')}
            {renderHeader('类目', 'category')}
            {renderHeader('价格', 'price', 'text-right')}
            {renderHeader('评论数', 'review_count', 'text-right')}
            {renderHeader('评分', 'review_rating', 'text-right')}
            {renderHeader('第三方卖家', 'third_party_seller')}
            {renderHeader('卖家国家', 'seller_country')}
            {renderHeader('活跃卖家数', 'active_seller_count', 'text-right')}
            {renderHeader('尺寸分级', 'size_tier')}
            {renderHeader('长', 'length', 'text-right')}
            {renderHeader('宽', 'width', 'text-right')}
            {renderHeader('高', 'height', 'text-right')}
            {renderHeader('重量', 'weight', 'text-right')}
            {renderHeader('年龄(月)', 'age_months', 'text-right')}
            {renderHeader('平台评分', 'platform_score', 'text-right')}
            {renderHeader('独立站评分', 'independent_score', 'text-right')}
            {renderHeader('录入时间', 'imported_at')}
          </tr>
        </thead>
        <tbody>
          {display.map((p) => (
            <tr
              key={p.id}
              className="border-t border-[var(--border)] hover:bg-[var(--muted)]"
            >
              <td className="p-2" style={{ width: 150 }}>
                {p.url ? (
                  <a
                    href={p.url}
                    target="_blank"
                    className="block w-[150px] text-center hover:underline"
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
                    <span className="mt-1 block w-[150px] truncate whitespace-nowrap">
                      {p.title || '查看'}
                    </span>
                  </a>
                ) : (
                  <div className="text-center w-[150px]">
                    {p.image_url && (
                      <img
                        src={p.image_url}
                        alt={p.title ?? ''}
                        style={{ width: 150, height: 150 }}
                        className="object-contain mx-auto"
                      />
                    )}
                    <span
                      className="mt-1 block w-[150px] truncate whitespace-nowrap"
                      title={p.title ?? ''}
                    >
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
              <td className="p-2 text-right">
                {p.platform_score != null ? (
                  <ScoreBadge value={p.platform_score} />
                ) : (
                  '-'
                )}
              </td>
              <td className="p-2 text-right">
                {p.independent_score != null ? (
                  <ScoreBadge value={p.independent_score} />
                ) : (
                  '-'
                )}
              </td>
              <td className="p-2">{p.imported_at ?? '-'}</td>
            </tr>
          ))}
          {status === 'loading' && (
            <tr>
              <td className="p-2 text-center" colSpan={20}>
                加载中，请等待...
              </td>
            </tr>
          )}
          {status === 'loaded' && !display.length && (
            <tr>
              <td className="p-2 text-center" colSpan={20}>
                暂无数据
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <span>每页</span>
          <select
            className="border px-1"
            value={limit}
            onChange={(e) => {
              setPage(1);
              setLimit(Number(e.target.value));
            }}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="border px-2 py-1"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            上一页
          </button>
          <span>
            {page} / {Math.max(1, Math.ceil(total / limit))}
          </span>
          <button
            className="border px-2 py-1"
            onClick={() =>
              setPage((p) =>
                Math.min(Math.ceil(total / limit), p + 1)
              )
            }
            disabled={page >= Math.ceil(total / limit)}
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  );
}
