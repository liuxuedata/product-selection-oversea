import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = req.query.id;
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Missing id' });
  }

  const { data, error } = await supabase
    .from('blackbox_files')
    .select('row_count, inserted_count, skipped_count, invalid_count')
    .eq('id', id)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'Not found' });
  }

  const inserted = data.inserted_count || 0;
  const skipped = data.skipped_count || 0;
  const invalid = data.invalid_count || 0;
  const total = data.row_count || 0;
  const processed = inserted + skipped + invalid;
  const progress = total > 0 ? processed / total : 0;

  return res.status(200).json({
    progress,
    completed: processed >= total && total > 0,
    stats: { inserted, skipped, invalid, total },
  });
}
