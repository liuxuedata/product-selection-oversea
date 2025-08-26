"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ScoreBadge from "@/components/ScoreBadge";

type TrendItem = {
  keyword: string;
  trend_score: number;
  g_score: number;
  t_score: number;
  rank: number;
  sources: string[];
};

const countries = ["US", "UK", "FR", "DE"];
const categories = [
  { value: "shopping", label: "Shopping" },
  { value: "tech_electronics", label: "Tech & Electronics" },
  { value: "vehicle_transport", label: "Vehicle & Transportation" },
];
const windows = ["1d", "7d", "30d"];

export default function TrendsPage() {
  const [country, setCountry] = useState("US");
  const [category, setCategory] = useState("shopping");
  const [windowPeriod, setWindowPeriod] = useState("7d");
  const [items, setItems] = useState<TrendItem[]>([]);

  useEffect(() => {
    async function load() {
      const params = new URLSearchParams({
        country,
        category,
        window: windowPeriod,
      });
      const res = await fetch(`/api/trends?${params.toString()}`).then((r) =>
        r.json()
      );
      setItems(res.items || []);
    }
    load();
  }, [country, category, windowPeriod]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Trends</h1>

      <div className="flex gap-4">
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="border px-2 py-1"
        >
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border px-2 py-1"
        >
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          value={windowPeriod}
          onChange={(e) => setWindowPeriod(e.target.value)}
          className="border px-2 py-1"
        >
          {windows.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-[var(--border)]">
          <thead className="bg-[var(--muted)]">
            <tr>
              <th className="p-2 text-left">Keyword</th>
              <th className="p-2 text-left">TrendScore</th>
              <th className="p-2 text-left">G Score</th>
              <th className="p-2 text-left">T Score</th>
              <th className="p-2 text-left">Rank</th>
              <th className="p-2 text-left">来源</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.keyword}
                className="border-t border-[var(--border)]"
              >
                <td className="p-2">
                  <Link
                    href={`/trends/${encodeURIComponent(item.keyword)}`}
                    className="text-blue-600 hover:underline"
                  >
                    {item.keyword}
                  </Link>
                </td>
                <td className="p-2">
                  <ScoreBadge value={item.trend_score} />
                </td>
                <td className="p-2">
                  <ScoreBadge value={item.g_score} />
                </td>
                <td className="p-2">
                  <ScoreBadge value={item.t_score} />
                </td>
                <td className="p-2">{item.rank}</td>
                <td className="p-2">{item.sources.join(", ")}</td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td className="p-2 text-center" colSpan={6}>
                  暂无数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

