import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
  const { data, error } = await supabase
    .from('blackbox_files')
    .select('id, filename, doc_type, uploaded_at')
    .order('uploaded_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data || []);
}
