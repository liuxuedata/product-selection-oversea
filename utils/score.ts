export const SCORE_TIERS = { STRONG: 85, RECOMMEND: 70, MIN: 55 } as const;

export function scoreTag(score: number) {
  if (score >= SCORE_TIERS.STRONG) return { label: "优秀", tone: "success" } as const;
  if (score >= SCORE_TIERS.RECOMMEND) return { label: "良好", tone: "info" } as const;
  if (score >= SCORE_TIERS.MIN) return { label: "一般", tone: "warning" } as const;
  return { label: "不建议", tone: "neutral" } as const;
}
