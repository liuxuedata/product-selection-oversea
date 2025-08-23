import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
  const limit = parseInt((req.query.limit as string) ?? '100', 10);
  const { data, error } = await supabase
    .from('v_blackbox_rows_with_scores')
    .select('*')
    .order('imported_at', { ascending: false })
    .limit(limit);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ rows: data });
}
