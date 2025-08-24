import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
  const { id } = req.query;
  const { data, error } = await supabase
    .from('upload_tasks')
    .select('status, progress, error, result')
    .eq('id', id)
    .single();
  if (error || !data) return res.status(404).json({ error: error?.message || 'Not found' });
  return res.status(200).json(data);
}
