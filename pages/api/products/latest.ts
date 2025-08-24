import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    let query = supabase
      .from('v_blackbox_rows_with_scores')
      .select('row_id, url, image_url, asin, title, platform_score, independent_score, imported_at')
      .order('imported_at', { ascending: false })
      .limit(200);

    if ('recommend' in req.query) {
      query = query.gte('platform_score', 55);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ items: data || [] });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
