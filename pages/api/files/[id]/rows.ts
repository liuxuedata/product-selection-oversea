import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
  const { id } = req.query;
  const page = parseInt((req.query.page as string) ?? '1', 10);
  const limit = parseInt((req.query.limit as string) ?? '50', 10);
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const {
    platformMin,
    platformMax,
    independentMin,
    independentMax,
    keyword,
    category,
    startDate,
    thirdPartySeller,
  } = req.query;

  let query = supabase
    .from('v_blackbox_rows_with_scores')
    .select('*', { count: 'exact' })
    .eq('file_id', id);

  if (platformMin) query = query.gte('platform_score', Number(platformMin));
  if (platformMax) query = query.lte('platform_score', Number(platformMax));
  if (independentMin)
    query = query.gte('independent_score', Number(independentMin));
  if (independentMax)
    query = query.lte('independent_score', Number(independentMax));
  if (keyword) query = query.ilike('title', `%${keyword}%`);
  if (category) query = query.eq('category', category);
  if (thirdPartySeller) query = query.eq('third_party_seller', thirdPartySeller);
  if (startDate) {
    const iso = new Date(String(startDate)).toISOString();
    query = query.gte('created_at', iso);
  }

  const { data, error, count } = await query
    .order('row_index', { ascending: true })
    .range(from, to);
  if (error) return res.status(500).json({ error: error.message });
  const rows = data?.map((r: any) => ({
    ...r,
    import_at: r.import_at ?? r.created_at ?? null,
  }));
  return res.status(200).json({ rows, count });
}
