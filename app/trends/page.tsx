"use client";
import { useEffect, useState } from "react";

type Row = {
  source_id: string; country: string; category_key: string; window_period: string;
  keyword: string; rank: number; raw_score: number; collected_at: string;
};

export default function TrendsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState({ source_id: "all", country: "US", category_key: "tech_electronics", window_period: "7d" });
  const [loading, setLoading] = useState(false);

  async function fetchData() {
    setLoading(true);
    const p = new URLSearchParams();
    if (q.source_id !== "all") p.set("source_id", q.source_id);
    p.set("country", q.country);
    p.set("category_key", q.category_key);
    p.set("window_period", q.window_period);
    const res = await fetch(`/api/trends/search?${p.toString()}`, { cache: "no-store" });
    const data = await res.json();
    setRows(data.rows || []);
    setLoading(false);
  }
  useEffect(()=>{ fetchData(); }, [q.country, q.category_key, q.window_period, q.source_id]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">趋势看板</h1>

      <div className="flex gap-2 items-center">
        <label>来源</label>
        <select value={q.source_id} onChange={e=>setQ({...q, source_id:e.target.value})} className="border px-2 py-1">
          <option value="all">全部</option>
          <option value="tiktok_trends">TikTok</option>
          <option value="google_trends">Google</option>
        </select>

        <label>国家</label>
        <select value={q.country} onChange={e=>setQ({...q, country:e.target.value})} className="border px-2 py-1">
          {["US","UK","FR","DE"].map(c=> <option key={c} value={c}>{c}</option>)}
        </select>

        <label>类目</label>
        <select value={q.category_key} onChange={e=>setQ({...q, category_key:e.target.value})} className="border px-2 py-1">
          <option value="tech_electronics">Tech & Electronics</option>
          <option value="vehicle_transportation">Vehicle & Transportation</option>
        </select>

        <label>窗口</label>
        <select value={q.window_period} onChange={e=>setQ({...q, window_period:e.target.value})} className="border px-2 py-1">
          <option value="1d">1d</option>
          <option value="7d">7d</option>
          <option value="30d">30d</option>
        </select>

        <button onClick={fetchData} className="px-3 py-1 border">刷新</button>
      </div>

      {loading ? <div>加载中...</div> : (
        <table className="w-full text-sm border">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-2 border">来源</th>
              <th className="p-2 border">国家</th>
              <th className="p-2 border">类目</th>
              <th className="p-2 border">窗口</th>
              <th className="p-2 border">排名</th>
              <th className="p-2 border">关键词</th>
              <th className="p-2 border">得分</th>
              <th className="p-2 border">采集时间</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={i}>
                <td className="p-2 border">{r.source_id}</td>
                <td className="p-2 border">{r.country}</td>
                <td className="p-2 border">{r.category_key}</td>
                <td className="p-2 border">{r.window_period}</td>
                <td className="p-2 border">{r.rank}</td>
                <td className="p-2 border">{r.keyword}</td>
                <td className="p-2 border">{r.raw_score}</td>
                <td className="p-2 border">{new Date(r.collected_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
