import { pickNumber } from './field';

export function computeScores(row: Record<string, any>) {
  const rating = pickNumber(row, ['review_rating', 'rating', '评分']);
  const reviews = pickNumber(row, ['review_count', 'reviews', '评论数量', '评价数量']);
  const price = pickNumber(row, ['price', '价格', '售价']);
  const sales = pickNumber(row, ['asin_sales', 'sales', '销量']);
  const trend = pickNumber(row, ['sales_trend_90d', 'sales_trend', '销量趋势（90 天） (%)']);

  const ratingScore = (rating / 5) * 20; // max 20
  const reviewScore = Math.min(reviews / 1000, 1) * 20; // max 20
  const priceScore = price > 0 ? Math.min(100 / price, 1) * 20 : 0; // cheaper gets higher up to 20
  const salesScore = Math.min(sales / 1000, 1) * 20; // max 20
  const trendScore = Math.min((trend + 100) / 200, 1) * 20; // -100..100 -> 0..20

  const platform_score = ratingScore + reviewScore + salesScore + trendScore + priceScore;
  const independent_score = ratingScore + reviewScore + trendScore * 2 + priceScore * 1.5;

  return {
    platform_score: Math.round(platform_score * 100) / 100,
    independent_score: Math.round(independent_score * 100) / 100,
  };
}
