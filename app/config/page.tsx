"use client";

import { useEffect, useState } from "react";

type WeightRow = {
  metric: string;
  platform_weight: number;
  independent_weight: number;
};

const METRICS: { key: string; label: string }[] = [
  { key: "price", label: "价格" },
  { key: "priceTrend", label: "价格趋势（90天）" },
  { key: "asinSales", label: "ASIN销量" },
  { key: "salesTrend", label: "销量趋势（90天）" },
  { key: "parentIncome", label: "父级收入" },
  { key: "asinIncome", label: "ASIN收入" },
  { key: "review", label: "评论" },
  { key: "seller", label: "卖家数" },
  { key: "lastYearSales", label: "去年销量" },
  { key: "yoy", label: "年同比" },
  { key: "size", label: "尺寸" },
  { key: "weight", label: "重量" },
  { key: "storage", label: "仓储费用" },
  { key: "age", label: "年龄（月）" },
  { key: "img", label: "图片数" },
  { key: "variant", label: "变体数" },
];

export default function ConfigPage() {
  const [weights, setWeights] = useState<WeightRow[]>([]);

  useEffect(() => {
    fetch("/api/score-weights")
      .then((r) => r.json())
      .then((data) => {
        const arr = METRICS.map((m) => {
          const found = (data.weights || []).find(
            (w: any) => w.metric === m.key
          );
          return {
            metric: m.key,
            platform_weight: found?.platform_weight ?? 0,
            independent_weight: found?.independent_weight ?? 0,
          };
        });
        setWeights(arr);
      });
  }, []);

  const update = (
    metric: string,
    field: keyof WeightRow,
    value: number
  ) => {
    setWeights((prev) =>
      prev.map((w) => (w.metric === metric ? { ...w, [field]: value } : w))
    );
  };

  const save = async () => {
    await fetch("/api/score-weights", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weights }),
    });
    alert("已保存");
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">评分配置</h1>
      <table className="w-full text-sm border border-[var(--border)]">
        <thead className="bg-[var(--muted)]">
          <tr>
            <th className="p-2 text-left">维度</th>
            <th className="p-2 text-left">平台权重</th>
            <th className="p-2 text-left">独立站权重</th>
          </tr>
        </thead>
        <tbody>
          {weights.map((w) => (
            <tr key={w.metric} className="border-t border-[var(--border)]">
              <td className="p-2">
                {METRICS.find((m) => m.key === w.metric)?.label}
              </td>
              <td className="p-2">
                <input
                  type="number"
                  step="0.01"
                  className="border px-1 w-24"
                  value={w.platform_weight}
                  onChange={(e) =>
                    update(
                      w.metric,
                      "platform_weight",
                      parseFloat(e.target.value)
                    )
                  }
                />
              </td>
              <td className="p-2">
                <input
                  type="number"
                  step="0.01"
                  className="border px-1 w-24"
                  value={w.independent_weight}
                  onChange={(e) =>
                    update(
                      w.metric,
                      "independent_weight",
                      parseFloat(e.target.value)
                    )
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        onClick={save}
        className="px-4 py-2 border bg-[var(--muted)]"
      >
        保存
      </button>
    </div>
  );
}

