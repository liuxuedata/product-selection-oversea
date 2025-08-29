"use client";

import { useEffect, useState } from "react";

type TrendRow = {
  source_id: string;
  country: string;
  category_key: string;
  window_period: string;
  keyword: string;
  rank: number;
  raw_score: number;
  collected_at: string;
};

export default function TrendsPage() {
  const [rows, setRows] = useState<TrendRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    source_id: "all",
    country: "US",
    category_key: "tech_electronics",
    window_period: "7d",
  });

  async function fetchData() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.source_id !== "all") params.set("source_id", filters.source_id);
    params.set("country", filters.country);
    params.set("category_key", filters.category_key);
    params.set("window_period", filters.window_period);

    const res = await fetch(`/api/trends/search?${params.toString()}`, {
      cache: "no-store",
    });
    const data = await res.json();
    setRows(data.rows || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, [filters]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">趋势看板</h1>

      {/* 筛选条件 */}
      <div className="flex gap-4 flex-wrap">
        <div>
          <label className="mr-2">来源</label>
          <select
            value={filters.source_id}
            onChange={(e) =>
              setFilters({ ...filters, source_id: e.target.value })
            }
            className="border rounded px-2 py-1"
          >
            <option value="all">全部</option>
            <option value="tiktok_trends">TikTok</option>
            <option value="google_trends">Google</option>
          </select>
        </div>

        <div>
          <label className="mr-2">国家</label>
          <select
            value={filters.country}
            onChange={(e) =>
              setFilters({ ...filters, country: e.target.value })
            }
            className="border rounded px-2 py-1"
          >
            {["US", "UK", "FR", "DE"].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mr-2">类目</label>
          <select
            value={filters.category_key}
            onChange={(e) =>
              setFilters({ ...filters, category_key: e.target.value })
            }
            className="border rounded px-2 py-1"
          >
            <option value="tech_electronics">Tech & Electronics</option>
            <option value="vehicle_transportation">
              Vehicle & Transportation
            </option>
          </select>
        </div>

        <div>
          <label className="mr-2">窗口</label>
          <select
            value={filters.window_period}
            onChange={(e) =>
              setFilters({ ...filters, window_period: e.target.value })
            }
            className="border rounded px-2 py-1"
          >
            <option value="1d">1天</option>
            <option value="7d">7天</option>
            <option value="30d">30天</option>
          </select>
        </div>

        <button
          onClick={fetchData}
          className="px-3 py-1 border rounded hover:bg-gray-50"
        >
          刷新
        </button>
      </div>

      {/* 表格 */}
      {loading ? (
        <div>加载中...</div>
      ) : (
        <table className="w-full text-sm border-collapse border">
          <thead>
            <tr className="bg-gray-50">
              <th className="border px-2 py-1">来源</th>
              <th className="border px-2 py-1">国家</th>
              <th className="border px-2 py-1">类目</th>
              <th className="border px-2 py-1">窗口</th>
              <th className="border px-2 py-1">排名</th>
              <th className="border px-2 py-1">关键词</th>
              <th className="border px-2 py-1">得分</th>
              <th className="border px-2 py-1">采集时间</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="border px-2 py-1">{r.source_id}</td>
                <td className="border px-2 py-1">{r.country}</td>
                <td className="border px-2 py-1">{r.category_key}</td>
                <td className="border px-2 py-1">{r.window_period}</td>
                <td className="border px-2 py-1">{r.rank}</td>
                <td className="border px-2 py-1">{r.keyword}</td>
                <td className="border px-2 py-1">{r.raw_score}</td>
                <td className="border px-2 py-1">
                  {new Date(r.collected_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
