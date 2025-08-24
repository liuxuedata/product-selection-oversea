import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Method Not Allowed' });

  const {
    platformMin,
    platformMax,
    independentMin,
    independentMax,
    keyword,
    category,
    recommend,
  } = req.query;

  let query = supabase
    .from('blackbox_rows')
    .select(
      `
        id,
        url,
        image_url,
        asin,
        title,
        brand,
        shipping,
        category,
        price,
        review_count,
        review_rating,
        third_party_seller,
        seller_country,
        active_seller_count,
        size_tier,
        length,
        width,
        height,
        weight,
        age_months,
        imported_at,
        product_scores!inner(platform_score,independent_score)
      `
    );

  if (platformMin)
    query = query.gte('product_scores.platform_score', Number(platformMin));
  if (platformMax)
    query = query.lte('product_scores.platform_score', Number(platformMax));
  if (independentMin)
    query = query.gte('product_scores.independent_score', Number(independentMin));
  if (independentMax)
    query = query.lte('product_scores.independent_score', Number(independentMax));
  if (keyword) query = query.ilike('title', `%${keyword}%`);
  if (category) query = query.eq('category', category as string);
  if (recommend) query = query.gte('product_scores.platform_score', 55);

  const { data, error } = await query
    .order('imported_at', { ascending: false })
    .limit(200);

  if (error) return res.status(500).json({ error: error.message });

  const rows =
    data?.map((r: any) => {
      const { id, product_scores, ...rest } = r;
      return {
        row_id: id,
        ...rest,
        platform_score: product_scores?.platform_score ?? null,
        independent_score: product_scores?.independent_score ?? null,
      };
    }) ?? [];

  return res.status(200).json({ rows });
}
