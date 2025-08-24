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
    .from('v_blackbox_rows_with_scores')
    .select(
      'row_id,url,image_url,asin,title,brand,shipping,category,price,review_count,review_rating,third_party_seller,seller_country,active_seller_count,size_tier,length,width,height,weight,age_months,platform_score,independent_score,imported_at'
    );

  if (platformMin) query = query.gte('platform_score', Number(platformMin));
  if (platformMax) query = query.lte('platform_score', Number(platformMax));
  if (independentMin) query = query.gte('independent_score', Number(independentMin));
  if (independentMax) query = query.lte('independent_score', Number(independentMax));
  if (keyword) query = query.ilike('title', `%${keyword}%`);
  if (category) query = query.eq('category', category as string);
  if (recommend) query = query.gte('platform_score', 55);

  const { data, error } = await query
    .order('imported_at', { ascending: false })
    .limit(200);

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ rows: data });
}
