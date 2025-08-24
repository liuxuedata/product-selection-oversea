import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

const TIER_RANGES: Record<string, [number, number?]> = {
  excellent: [85],
  potential: [70, 85],
  average: [55, 70],
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const page = parseInt((req.query.page as string) ?? '1', 10);
  const limit = parseInt((req.query.limit as string) ?? '50', 10);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const keyword = (req.query.keyword as string) || '';
  const category = (req.query.category as string) || '';
  const tier = (req.query.tier as string) || '';

  let query = supabase
    .from('v_blackbox_rows_with_scores')
    .select('*')
    .order('scored_at', { ascending: false });

  const [minScore, maxScore] = TIER_RANGES[tier] || [55, undefined];
  if (minScore !== undefined) query = query.gte('platform_score', minScore);
  if (maxScore !== undefined) query = query.lt('platform_score', maxScore);
  if (keyword) query = query.ilike('title', `%${keyword}%`);
  if (category) query = query.eq('category', category);

  const { data, error } = await query.range(0, 299);
  if (error) return res.status(500).json({ error: error.message });

  const rows = data || [];
  const total = rows.length;
  const paged = rows.slice(from, to + 1);
  return res.status(200).json({ rows: paged, count: total });
}
