import { pickNumber, pickString } from './field';

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

export function computeScores(row: Record<string, any>) {
  // --- base fields ---
  const price = pickNumber(row, ['price', '价格', '售价']);
  const priceTrend = pickNumber(row, ['price_trend_90d', '价格趋势（90 天） (%)', '价格趋势（90天） (%)', 'Price Trend (90d) (%)']);
  const asinSales = pickNumber(row, ['asin_sales', 'sales', '销量', 'ASIN 销量']);
  const salesTrend = pickNumber(row, ['sales_trend_90d', 'sales_trend', '销量趋势（90 天） (%)', '销量趋势（90天） (%)']);
  const parentIncome = pickNumber(row, ['parent_revenue', '父级收入']);
  const asinIncome = pickNumber(row, ['asin_revenue', 'ASIN 收入']);
  const reviewCount = pickNumber(row, ['review_count', 'reviews', '评论数量', '评价数量']);
  const reviewRating = pickNumber(row, ['review_rating', 'rating', '评分']);
  const sellerCount = pickNumber(row, ['active_seller_count', '活跃卖家数量']);
  const lastYearSales = pickNumber(row, ['last_year_sales', '去年销量']);
  const yoy = pickNumber(row, ['yoy_sales_percent', '销量年同比 (%)', '销量年同比(%)']);
  const sizeType = pickString(row, ['size_tier', '尺寸分级']);
  const weight = pickNumber(row, ['weight', '重量']);
  const storage1 = pickNumber(row, ['storage_fee_jan_sep', '仓储费用 (1 月 - 9 月)', '仓储费用 (1月-9月)']);
  const storage2 = pickNumber(row, ['storage_fee_oct_dec', '仓储费用 (10 月 - 12 月)', '仓储费用 (10月-12月)']);
  const age = pickNumber(row, ['age_months', '年龄（月）', '年龄(月)']);
  const imgCount = pickNumber(row, ['image_count', '图片的数量', '图片数量']);
  const variantCount = pickNumber(row, ['variant_count', '变体数量']);

  // --- dimension scores ---
  // platform site price preference: 10~200 sweet spot
  let priceScorePlatform = 0;
  if (price < 10) priceScorePlatform = 30 + price * 4;
  else if (price <= 200) priceScorePlatform = 70 + (200 - Math.abs(price - 80)) * 0.3;
  else priceScorePlatform = Math.max(30, 100 - (price - 200) * 0.3);

  // independent site price scoring: higher price favored up to 400+
  let priceScoreIndependent = 0;
  if (price >= 400) priceScoreIndependent = 100;
  else if (price >= 300) priceScoreIndependent = 80 + (20 * (price - 300)) / 100;
  else if (price >= 200) priceScoreIndependent = 60 + (20 * (price - 200)) / 100;
  else if (price >= 100) priceScoreIndependent = 40 + (20 * (price - 100)) / 100;
  else priceScoreIndependent = (40 * price) / 100;

  const priceTrendScore = priceTrend >= 50 ? 100 : priceTrend >= 0 ? 50 + priceTrend : Math.max(0, 50 + priceTrend);

  const asinSalesScore = asinSales >= 2000 ? 100 : asinSales / 20;
  const salesTrendScore = salesTrend >= 50 ? 100 : salesTrend >= 0 ? 50 + salesTrend : Math.max(0, 50 + salesTrend);

  const parentIncomeScore = parentIncome >= 100000 ? 100 : parentIncome / 1000;
  const asinIncomeScore = asinIncome >= 50000 ? 100 : asinIncome / 500;

  let reviewCountScore = 0;
  if (reviewCount >= 4000) reviewCountScore = Math.max(75, 100 - (reviewCount - 2000) * 0.0125);
  else if (reviewCount >= 2000) reviewCountScore = 100 - (reviewCount - 2000) * 0.0125;
  else if (reviewCount >= 1000) reviewCountScore = 90 + 10 * (reviewCount - 1000) / 1000;
  else if (reviewCount >= 100) reviewCountScore = 50 + 40 * (reviewCount - 100) / 900;
  else if (reviewCount >= 20) reviewCountScore = 20 + 30 * (reviewCount - 20) / 80;
  else reviewCountScore = reviewCount * 1;

  let reviewRatingScore = 0;
  if (reviewRating >= 4.7) reviewRatingScore = 100;
  else if (reviewRating >= 4.5) reviewRatingScore = 80 + 20 * (reviewRating - 4.5) / 0.2;
  else if (reviewRating >= 4.2) reviewRatingScore = 60 + 20 * (reviewRating - 4.2) / 0.3;
  else if (reviewRating >= 4.0) reviewRatingScore = 50 + 10 * (reviewRating - 4.0) / 0.2;
  else reviewRatingScore = Math.max(20, reviewRating * 10);

  const reviewFinalScore = reviewCountScore * (reviewRatingScore / 100);

  const sellerScore =
    sellerCount >= 10 && sellerCount <= 40
      ? 100
      : sellerCount < 10
      ? sellerCount * 10
      : sellerCount > 40 && sellerCount < 100
      ? 100 - (sellerCount - 40) * 2
      : 0;

  const lastYearSalesScore = lastYearSales >= 1500 ? 100 : lastYearSales / 15;

  const yoyScore = yoy >= 50 ? 100 : yoy >= 0 ? 50 + yoy : 20 + yoy / 2;

  let sizeScore = 0;
  if (sizeType === '小型' || sizeType?.toLowerCase() === 'small') sizeScore = 100;
  else if (sizeType === '中型' || sizeType?.toLowerCase() === 'medium') sizeScore = 70;
  else if (sizeType === '大型' || sizeType?.toLowerCase() === 'large' || sizeType === '大型标准件') sizeScore = 40;
  else sizeScore = 50;

  const weightScore = weight <= 1 ? 100 : weight <= 5 ? 100 - (weight - 1) * 20 : 20;

  const storageTotal = storage1 + storage2;
  const storageScore = storage1 <= 1 && storage2 <= 1 ? 100 : storageTotal < 5 ? 80 : 40;

  const ageScore = age <= 6 ? 100 : age <= 40 ? 100 - 2 * (age - 6) : 40;

  const imgScore = imgCount >= 5 ? 100 : imgCount * 20;

  const variantScore = variantCount >= 2 ? 100 : variantCount * 50;

  const totalScore =
    priceScorePlatform * 0.02 +
    priceTrendScore * 0.02 +
    asinSalesScore * 0.11 +
    salesTrendScore * 0.09 +
    parentIncomeScore * 0.07 +
    asinIncomeScore * 0.07 +
    reviewFinalScore * 0.16 +
    sellerScore * 0.07 +
    lastYearSalesScore * 0.07 +
    yoyScore * 0.07 +
    sizeScore * 0.03 +
    weightScore * 0.03 +
    storageScore * 0.03 +
    ageScore * 0.06 +
    imgScore * 0.02 +
    variantScore * 0.02;

  const platform_score = clamp(totalScore);

  // --- independent site total ---
  const independentTotal =
    priceScoreIndependent * 0.08 +
    priceTrendScore * 0.05 +
    asinSalesScore * 0.06 +
    salesTrendScore * 0.06 +
    parentIncomeScore * 0.06 +
    asinIncomeScore * 0.06 +
    reviewFinalScore * 0.12 +
    sellerScore * 0.08 +
    lastYearSalesScore * 0.05 +
    yoyScore * 0.05 +
    sizeScore * 0.05 +
    weightScore * 0.04 +
    storageScore * 0.04 +
    ageScore * 0.09 +
    imgScore * 0.03 +
    variantScore * 0.02;

  const independent_score = clamp(independentTotal);

  return {
    platform_score: Math.round(platform_score * 100) / 100,
    independent_score: Math.round(independent_score * 100) / 100,
  };
}
