import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { logError, logInfo } from '@/lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { data, error } = await supabase
    .from('v_blackbox_rows_with_scores')
    .select('category')
    .not('category', 'is', null)
    .order('category');

  let rows = data;
  if (error) {
    await logError('fetch categories failed', error);
    const fallback = await supabase
      .from('blackbox_rows')
      .select('category')
      .not('category', 'is', null)
      .order('category');
    if (fallback.error) {
      await logError('fetch categories fallback failed', fallback.error);
      return res.status(500).json({ error: fallback.error.message });
    }
    rows = fallback.data;
  }

  const categories = Array.from(
    new Set((rows || []).map((row: { category: string }) => row.category))
  );
  await logInfo('categories fetched', { count: categories.length });
  return res.status(200).json({ categories });
}
