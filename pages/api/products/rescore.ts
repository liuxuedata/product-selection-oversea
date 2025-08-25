import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { computeScores } from '@/lib/scoring';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { data: rows, error: rowsErr } = await supabase.from('blackbox_rows').select('id, data');
  if (rowsErr) return res.status(500).json({ error: rowsErr.message });

  const { data: existingScores, error: scoresErr } = await supabase
    .from('product_scores')
    .select('row_id, platform_score, independent_score');
  if (scoresErr) return res.status(500).json({ error: scoresErr.message });

  const map = new Map(existingScores.map((s) => [s.row_id, s]));
  let rescored = 0;

  for (const row of rows) {
    const s = map.get(row.id);
    if (!s || s.platform_score === 0 || s.independent_score === 0) {
      const scores = computeScores(row.data as any);
      if (scores.platform_score === 0 && scores.independent_score === 0) continue;
      await supabase.from('product_scores').upsert({ row_id: row.id, ...scores });
      rescored++;
    }
  }

  const { count: zeroItems, error: zeroErr } = await supabase
    .from('product_scores')
    .select('row_id', { count: 'exact', head: true })
    .eq('platform_score', 0)
    .eq('independent_score', 0);
  if (zeroErr) return res.status(500).json({ error: zeroErr.message });

  return res.status(200).json({ rescored, zeroItems });
}
