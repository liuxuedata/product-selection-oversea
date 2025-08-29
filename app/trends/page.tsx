"use client";

import { useEffect, useMemo, useState } from "react";

type TrendRow = {
  source_id: string;
  country: string;
  category_key: string;
  window_period: string;
  keyword: string;
  rank: number | null;
  raw_score: number | null;
  collected_at: string;
};

type ApiResp = {
  ok: boolean;
  mode: "all" | "latest";
  total: number;
  limit: number;
  offset: number;
  rows: TrendRow[];
};

const COUNTRIES = ["US", "UK", "FR", "DE"] as const;
const CATEGORIES = [
  { key: "tech_electronics", label: "Tech & Electronics" },
  { key: "vehicle_transportation", label: "Vehicle & Transportation" },
] as const;
const WINDOWS = ["1d", "7d", "30d"] as const;
const SORTS = [
  { key: "collected_at_desc", label: "按采集时间(新→旧)" },
  { key: "rank_asc", label: "按排名(小→大)" },
  { key: "score_desc", label: "按得分(高→低)" },
] as const;

export default function TrendsPage() {
  const [rows, setRows] = useState<TrendRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState({
    source_id: "all", // 'all' | 'tiktok_trends' | 'google_trends'
    country: "US",
    category_key: "tech_electronics",
    window_period: "7d",
    sort: "collected_at_desc", // rank_asc | score_desc
    mode: "latest" as "latest" | "all",
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // 组合查询字符串
  const searchQS = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.source_id !== "all") params.set("source_id", filters.source_id);
    params.set("country", filters.country);
    params.set("category_key", filters.category_key);
    params.set("window_period", filters.window_period);
    params.set("sort", filters.sort);
    params.set("mode", filters.mode);
    params.set("limit", String(pageSize));
    params.set("offset", String((page - 1) * pageSize));
    return params.toString();
  }, [filters, page, pageSize]);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/trends/search?${searchQS}`, { cache: "no-store" });
      const data: ApiResp = await res.json();
      setRows(data?.rows ?? []);
      setTotal(data?.total ?? 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setPage(1); // 任何筛选变化回到第一页
  }, [filters.source_id, filters.country, filters.category_key, filters.window_period, filters.sort, filters.mode]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQS]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function exportCSV() {
    const headers = [
      "source_id",
      "country",
      "category_key",
      "window_period",
      "keyword",
      "rank",
      "raw_score",
      "collected_at",
    ];
    const lines = [headers.join(",")];
    rows.forEach((r) => {
      const line = [
        r.source_id,
        r.country,
        r.category_key,
        r.window_period,
        csvEscape(r.keyword),
        String(r.rank ?? ""),
        String(r.raw_score ?? ""),
        r.collected_at,
      ].join(",");
      lines.push(line);
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const today = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `trends_${filters.country}_${filters.category_key}_${filters.window_period}_${filters.mode}_${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">趋势看板</h1>

      {/* 筛选条 */}
      <div className="flex flex-wrap items-end gap-3">
        {/* 来源 */}
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">来源</label>
          <select
            value={filters.source_id}
            onChange={(e) => setFilters({ ...filters, source_id: e.target.value })}
            className="border rounded px-2 py-1 min-w-[160px]"
          >
            <option value="all">全部来源</option>
            <option value="tiktok_trends">TikTok</option>
            <option value="google_trends">Google</option>
          </select>
        </div>

        {/* 国家 */}
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">国家</label>
          <select
            value={filters.country}
            onChange={(e) => setFilters({ ...filters, country: e.target.value })}
            className="border rounded px-2 py-1 min-w-[120px]"
          >
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* 类目 */}
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">类目</label>
          <select
            value={filters.category_key}
            onChange={(e) => setFilters({ ...filters, category_key: e.target.value })}
            className="border rounded px-2 py-1 min-w-[220px]"
          >
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* 窗口 */}
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">窗口</label>
          <select
            value={filters.window_period}
            onChange={(e) => setFilters({ ...filters, window_period: e.target.value })}
            className="border rounded px-2 py-1 min-w-[120px]"
          >
            {WINDOWS.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>

        {/* 排序 */}
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">排序</label>
          <select
            value={filters.sort}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
            className="border rounded px-2 py-1 min-w-[200px]"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* 最新/全部 */}
        <label className="flex items-center gap-2 ml-3">
          <input
            type="checkbox"
            checked={filters.mode === "latest"}
            onChange={(e) => setFilters({ ...filters, mode: e.target.checked ? "latest" : "all" })}
          />
          <span className="text-sm">只看最新一次</span>
        </label>

        {/* 导出 */}
        <button onClick={exportCSV} className="ml-auto px-3 py-1 border rounded hover:bg-gray-50">
          导出当前结果 CSV
        </button>
      </div>

      {/* 统计 & 分页 */}
      <div className="flex items-center gap-3 text-sm">
        <span>
          共 <b>{total}</b> 条，当前第 <b>{page}</b> / <b>{totalPages}</b> 页
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            上一页
          </button>
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            下一页
          </button>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="border rounded px-2 py-1"
          >
            {[20, 50, 100, 200].map((n) => (
              <option key={n} value={n}>
                {n}/页
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 表格 */}
      <div className="overflow-x-auto border rounded">
        {loading ? (
          <div className="p-6">加载中...</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-gray-500">暂无数据，换个筛选试试。</div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <Th>来源</Th>
                <Th>国家</Th>
                <Th>类目</Th>
                <Th>窗口</Th>
                <Th>排名</Th>
                <Th>关键词</Th>
                <Th>得分</Th>
                <Th>采集时间</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={`${r.source_id}-${r.country}-${r.keyword}-${r.collected_at}-${i}`} className="odd:bg-white even:bg-gray-50/30">
                  <Td>{r.source_id}</Td>
                  <Td>{r.country}</Td>
                  <Td>{r.category_key}</Td>
                  <Td>{r.window_period}</Td>
                  <Td>{r.rank ?? ""}</Td>
                  <Td className="max-w-[360px] truncate" title={r.keyword}>{r.keyword}</Td>
                  <Td>{r.raw_score ?? ""}</Td>
                  <Td>{formatDateTime(r.collected_at)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="border px-2 py-2 text-left">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="border px-2 py-1 align-top">{children}</td>;
}

function formatDateTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

function csvEscape(s: string) {
  if (s == null) return "";
  const needQuote = /[",\n]/.test(s);
  const escaped = String(s).replace(/"/g, '""');
  return needQuote ? `"${escaped}"` : escaped;
}
