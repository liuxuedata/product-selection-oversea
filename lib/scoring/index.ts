import { pickNumber } from './field';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n));
}

export function scoreRow(row: Record<string, any>): {
  platform_score: number;
  independent_score: number;
} {
  const rating = pickNumber(row, ['review_rating'], 0); // 0-5
  const reviewCount = pickNumber(row, ['review_count'], 0);
  const price = pickNumber(row, ['price'], 0);
  const sales = pickNumber(row, ['asin_sales', 'parent_sales'], 0);
  const trend = pickNumber(row, ['sales_trend_90d'], 0);

  const platform = clamp(
    rating * 20 +
      Math.min(40, reviewCount / 10) +
      Math.max(0, 40 - price)
  );

  const independent = clamp(Math.min(60, sales / 10) + Math.max(0, trend));

  return {
    platform_score: platform,
    independent_score: independent,
  };
}
