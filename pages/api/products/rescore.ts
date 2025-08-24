import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { computeScores } from '@/lib/scoring';

const BATCH_SIZE = 500;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    let lastId: number | null = null;
    let processed = 0;

    while (true) {
      let query = supabase
        .from('v_blackbox_rows_with_scores')
        .select('*')
        .or('platform_score.is.null,platform_score.eq.0,independent_score.is.null,independent_score.eq.0')
        .order('row_id', { ascending: true })
        .limit(BATCH_SIZE);
      if (lastId) query = query.gt('row_id', lastId);

      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length === 0) break;

      const updates = data.map((r: any) => {
        const scores = computeScores(r);
        return { row_id: r.row_id, imported_at: r.imported_at, ...scores };
      });

      await supabase.from('product_scores').upsert(updates);
      processed += updates.length;
      lastId = data[data.length - 1].row_id;
      if (data.length < BATCH_SIZE) break;
    }

    return res.status(200).json({ processed });
  } catch (err: any) {
    console.error('rescore failed', err);
    return res.status(500).json({ error: err.message });
  }
}
