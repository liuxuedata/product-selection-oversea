import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
  const { id } = req.query;
  const page = parseInt((req.query.page as string) ?? '1', 10);
  const limit = parseInt((req.query.limit as string) ?? '50', 10);
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const { data, error, count } = await supabase
    .from('v_blackbox_rows_with_scores')
    .select('*', { count: 'exact' })
    .eq('file_id', id)
    .order('row_index', { ascending: true })
    .range(from, to);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ rows: data, count });
}
