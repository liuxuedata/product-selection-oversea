import type { NextApiRequest, NextApiResponse } from "next";

type TrendItem = {
  keyword: string;
  trend_score: number;
  g_score: number;
  t_score: number;
  rank: number;
  sources: string[];
};

const sample: TrendItem[] = [
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

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.status(200).json({ items: sample });
}

