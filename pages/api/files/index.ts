import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { logError, logInfo } from '@/lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Method Not Allowed' });

  // Attempt to select detailed columns first, but fall back to a minimal
  // select if the schema hasn't been fully migrated yet (missing columns).
  let { data, error } = await supabase
    .from('blackbox_files')
    .select('id, filename, uploaded_at, row_count, inserted_count')
    .order('uploaded_at', { ascending: false });

  if (error) {
    await logError('fetch files failed', error);
    // Retry with a safer projection to ensure at least the id can be read.
    const retry = await supabase
      .from('blackbox_files')
      .select('id')
      .order('id', { ascending: false });
    if (retry.error) {
      await logError('fetch files retry failed', retry.error);
      return res.status(500).json({ error: retry.error.message });
    }
    data = retry.data as any;
  }

  await logInfo('fetched files', { count: data?.length || 0 });
  return res.status(200).json(data || []);
}
