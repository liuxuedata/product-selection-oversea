import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
  const { id } = req.query;
  const { data, error } = await supabase
    .from('v_blackbox_rows_with_scores')
    .select('*')
    .eq('row_id', id)
    .single();
  if (error) return res.status(500).json({ error: error.message });
  const row = data
    ? {
        ...data,
        import_at: data.import_at ?? data.created_at ?? null,
        status: data.status || 'processing',
      }
    : null;
  return res.status(200).json({ row });
}
