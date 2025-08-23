import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { data, error } = await supabase
    .from('v_blackbox_rows_with_scores')
    .select('category')
    .not('category', 'is', null)
    .order('category');

  if (error) return res.status(500).json({ error: error.message });
  const categories = Array.from(
    new Set((data || []).map((row: { category: string }) => row.category))
  );
  return res.status(200).json({ categories });
}
