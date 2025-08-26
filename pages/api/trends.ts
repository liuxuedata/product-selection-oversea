import type { NextApiRequest, NextApiResponse } from "next";

type TrendItem = {
  keyword: string;
  trend_score: number;
  g_score: number;
  t_score: number;
  rank: number;
  sources: string[];
};

const base: TrendItem[] = [
  {
    keyword: "wireless charger",
    trend_score: 92,
    g_score: 95,
    t_score: 88,
    rank: 1,
    sources: ["google", "tiktok"],
  },
  {
    keyword: "smart watch",
    trend_score: 81,
    g_score: 79,
    t_score: 83,
    rank: 2,
    sources: ["google", "tiktok"],
  },
  {
    keyword: "folding bike",
    trend_score: 68,
    g_score: 70,
    t_score: 66,
    rank: 3,
    sources: ["google"],
  },
];

function adjustScore(baseScore: number, seed: string) {
  const delta =
    (seed.charCodeAt(0) + seed.charCodeAt(seed.length - 1)) % 10 - 5;
  const value = baseScore + delta;
  return Math.max(0, Math.min(100, value));
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    country = "US",
    category = "shopping",
  } = req.query as { country?: string; category?: string };

  const seed = `${country}-${category}`;
  const items = base.map((item, idx) => ({
    ...item,
    keyword: `${item.keyword}-${country}-${category}`,
    trend_score: adjustScore(item.trend_score, seed),
    g_score: adjustScore(item.g_score, seed),
    t_score: adjustScore(item.t_score, seed),
    rank: idx + 1,
  }));

  res.status(200).json({ items });
}

