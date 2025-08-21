import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
  const { id } = req.query;
  const page = parseInt((req.query.page as string) ?? '1', 10);
  const limit = parseInt((req.query.limit as string) ?? '50', 10);
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const columns = `row_id, file_id, row_index, asin, url, title, image_url, brand, fulfillment, category, bsr, upc, gtin, ean, isbn, subcategory, subcategory_bsr, price, price_trend_90d, parent_sales, asin_sales, sales_trend_90d, parent_revenue, asin_revenue, review_count, review_rating, third_party_sellers, seller_country, active_sellers, last_year_sales, sales_yoy, size_tier, length, width, height, weight, storage_fee_jan_sep, storage_fee_oct_dec, best_sales_period, age_months, image_count, variant_count, sales_review_ratio, platform_score, independent_score, scored_at`;
  const { data, error, count } = await supabase
    .from('v_blackbox_rows_with_scores')
    .select(columns, { count: 'exact' })
    .eq('file_id', id)
    .order('row_index', { ascending: true })
    .range(from, to);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ rows: data, count });
}
