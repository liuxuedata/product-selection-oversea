import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { data, error } = await supabase
    .from('v_blackbox_rows_with_scores')
    .select('third_party_seller')
    .not('third_party_seller', 'is', null)
    .order('third_party_seller');

  if (error) return res.status(500).json({ error: error.message });
  const sellers = Array.from(
    new Set((data || []).map((row: { third_party_seller: string }) => row.third_party_seller))
  );
  return res.status(200).json({ sellers });
}
