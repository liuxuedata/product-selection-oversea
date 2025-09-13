"use client";
import { useEffect, useState } from "react";
import ScoreBadge from "@/components/ScoreBadge";
import { useRouter } from "next/navigation";

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
  import_at: string | null;
};

type Filters = {
  keyword: string;
  category: string;
  startDate: string;
  seller: string;
};

export default function RecommendationsPage() {
  const FETCH_LIMIT = 500;
  const [items, setItems] = useState<Product[]>([]);
  const [sortKey, setSortKey] = useState<keyof Product | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [sellers, setSellers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<Filters>({
    keyword: '',
    category: '',
    startDate: '',
    seller: '',
  });
  const [filters, setFilters] = useState<Filters>({ ...draft });
  const router = useRouter();

  useEffect(() => {
    async function loadCategories() {
      const res = await fetch('/api/categories').then((r) => r.json());
      setCategories(res.categories || []);
    }
    loadCategories();
    async function loadSellers() {
      const res = await fetch('/api/sellers').then((r) => r.json());
      setSellers(res.sellers || []);
    }
    loadSellers();
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const files = await fetch('/api/files').then((r) => r.json());
      if (!Array.isArray(files) || !files.length) {
        setLoading(false);
        return;
      }
      const collected: Product[] = [];
      const seen = new Set<string>();
      for (const file of files) {
        if (collected.length >= FETCH_LIMIT) break;
        const params = new URLSearchParams({
          page: '1',
          limit: String(FETCH_LIMIT - collected.length),
          platformMin: '55',
        });
        Object.entries(filters).forEach(([k, v]) => {
          if (!v) return;
          if (k === 'seller') params.set('thirdPartySeller', v);
          else params.set(k, v);
        });
        const res = await fetch(`/api/files/${file.id}/rows?${params.toString()}`).then((r) => r.json());
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
          import_at: r.import_at ?? r.created_at ?? null,
        }));
        for (const p of mapped) {
          const key = p.asin || p.id;
          if (key && !seen.has(key)) {
            seen.add(key);
            collected.push(p);
            if (collected.length >= FETCH_LIMIT) break;
          }
        }
      }
      setItems(collected);
      setTotal(collected.length);
      setLoading(false);
    }
    load();
  }, [filters]);

  function handleSort(key: keyof Product) {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function handleRowDoubleClick(
    e: React.MouseEvent<HTMLTableRowElement>,
    id: string
  ) {
    const cell = (e.target as HTMLElement).closest('td');
    if (cell && (cell as HTMLTableCellElement).cellIndex === 0) return;
    router.push(`/products/${id}`);
  }

  const sorted = [...items];
  if (sortKey) {
    sorted.sort((a, b) => {
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
  const display = sorted.slice((page - 1) * limit, page * limit);

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
      {loading && (
        <div className="w-full">
          <progress className="w-full h-1" />
          <p className="text-xs text-center">数据加载中...</p>
        </div>
      )}
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
        <div>
          <label className="block text-xs">第三方卖家</label>
          <select
            className="border px-1"
            value={draft.seller}
            onChange={(e) => setDraft({ ...draft, seller: e.target.value })}
          >
            <option value="">全部</option>
            {sellers.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs">开始日期</label>
          <input
            type="date"
            className="border px-1"
            value={draft.startDate}
            onChange={(e) =>
              setDraft({ ...draft, startDate: e.target.value })
            }
          />
        </div>
        <button
          className="border px-3 py-1"
          onClick={() => {
            setPage(1);
            setFilters({ ...draft });
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
            {renderHeader('录入时间', 'import_at')}
            <th className="p-2">详情</th>
          </tr>
        </thead>
        <tbody>
          {display.map((p) => (
            <tr
              key={p.id}
              className="border-t border-[var(--border)] hover:bg-[var(--muted)]"
              onDoubleClick={(e) => handleRowDoubleClick(e, p.id)}
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
              <td className="p-2">
                {p.import_at
                  ? new Date(p.import_at).toLocaleString()
                  : '-'}
              </td>
              <td className="p-2">
                <a
                  href={`/products/${p.id}`}
                  className="text-blue-600 hover:underline"
                >
                  查看
                </a>
              </td>
            </tr>
          ))}
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
