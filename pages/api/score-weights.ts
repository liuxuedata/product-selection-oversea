import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('score_weights').select('*');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ weights: data });
  }

  if (req.method === 'PUT') {
    const { weights } = req.body as { weights: any[] };
    if (!Array.isArray(weights)) {
      return res.status(400).json({ error: 'Invalid payload' });
    }
    const { error } = await supabase.from('score_weights').upsert(weights);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
