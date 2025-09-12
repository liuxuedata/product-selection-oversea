import React from "react";
import SystemConfig from "@/components/SystemConfig";

const independentRows = [
  ["价格", "0.08", "400美金", "400+满分，逐级递减"],
  ["价格趋势（90天）", "0.05", "0.5", "越涨越高分，负增长降分"],
  ["ASIN销量", "0.06", "2000", "线性，2000满分"],
  ["销量趋势（90天）", "0.06", "0.5", "越涨越高分，负增长降分"],
  ["父级收入", "0.06", "10万", "线性，10万满分"],
  ["ASIN收入", "0.06", "5万", "线性，5万满分"],
  ["评论数量", "0.05", "1000", "线性，1000满分"],
  ["评论评分", "0.07", "4.7-5", "4.7-5满分，4.5-4.7得80"],
  ["卖家数", "0.08", "10~40", "10-40最优，其他降分"],
  ["去年销量", "0.05", "1500", "线性，1500满分"],
  ["年同比", "0.05", "0.5", "越涨越高分，负增长降分"],
  ["尺寸", "0.05", "小型", "小型满分，中型70，大型40"],
  ["重量", "0.04", "≤1kg", "≤1kg满分，1-5kg递减"],
  ["仓储费用", "0.04", "≤1", "≤1满分，<5高分，否则低分"],
  ["年龄（月）", "0.09", "≤6月", "新品高分，老品降分"],
  ["图片数", "0.03", "≥5", "5张满分，否则线性"],
  ["变体数", "0.02", "≥2", "2变体满分，否则线性"],
];

const platformRows = [
  [
    "价格",
    "0.02",
    "价格带不是核心决定项\n\n10~80美金得分线性增加（到顶），80-200缓慢递减（但都高于70分）。\n\n200以上逐步降低，超高价产品不是主流。\n\n0~10美金的极低价产品得分较低。",
  ],
  ["价格趋势", "0.02", "不是最关键，微调"],
  ["ASIN销量", "0.11", "核心，量大潜力大"],
  ["销量趋势", "0.09", "趋势正，平台爆品信号"],
  ["父级收入", "0.07", "销售额重要"],
  ["ASIN收入", "0.07", "—"],
  ["评论数量", "0.09", "消费者认可和沉淀"],
  ["评论评分", "0.09", "好评越高越好"],
  ["活跃卖家数", "0.07", "适中最优，太多太少都一般"],
  ["去年销量", "0.07", "有一定历史沉淀"],
  ["年同比", "0.07", "年度增速，爆品信号"],
  ["尺寸分级", "0.03", "轻微考虑"],
  ["重量", "0.03", "轻微考虑"],
  ["仓储费用", "0.03", "轻微考虑"],
  ["年龄（月）", "0.06", "新品有优势，但历史稳定也可接受"],
  ["图片数", "0.02", "次要"],
  ["变体数", "0.02", "次要"],
];

export default function ConfigPage() {
  return (
    <div className="p-6 space-y-10">
      <h1 className="text-2xl font-semibold">评分配置说明</h1>

      <section>
        <h2 className="text-xl font-semibold mb-2">独立站评分标准</h2>
        <table className="w-full text-sm border border-[var(--border)]">
          <thead className="bg-[var(--muted)]">
            <tr>
              <th className="p-2 text-left">评分维度</th>
              <th className="p-2 text-left">权重</th>
              <th className="p-2 text-left">单项满分条件</th>
              <th className="p-2 text-left">主要评分标准说明</th>
            </tr>
          </thead>
          <tbody>
            {independentRows.map((r, idx) => (
              <tr key={idx} className="border-t border-[var(--border)]">
                {r.map((c, i) => (
                  <td key={i} className="p-2">{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">平台站选品标准</h2>
        <table className="w-full text-sm border border-[var(--border)]">
          <thead className="bg-[var(--muted)]">
            <tr>
              <th className="p-2 text-left">维度</th>
              <th className="p-2 text-left">权重</th>
              <th className="p-2 text-left">说明</th>
            </tr>
          </thead>
          <tbody>
            {platformRows.map((r, idx) => (
              <tr key={idx} className="border-t border-[var(--border)]">
                <td className="p-2">{r[0]}</td>
                <td className="p-2">{r[1]}</td>
                <td className="p-2 whitespace-pre-line">{r[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">系统配置</h2>
        <SystemConfig />
      </section>
    </div>
  );
}
