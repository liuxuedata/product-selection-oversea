import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { logError, logInfo } from '@/lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Method Not Allowed' });

  const { id } = req.query;
  const page = parseInt((req.query.page as string) ?? '1', 10);
  const limit = parseInt((req.query.limit as string) ?? '50', 10);
  let from = (page - 1) * limit;
  let to = from + limit - 1;
  const {
    platformMin,
    platformMax,
    independentMin,
    independentMax,
    keyword,
    category,
  } = req.query;

  // Prefer the view with joined scores if available.
  let query = supabase
    .from('v_blackbox_rows_with_scores')
    .select('*', { count: 'exact' })
    .eq('file_id', id);

  if (platformMin) query = query.gte('platform_score', Number(platformMin));
  if (platformMax) query = query.lte('platform_score', Number(platformMax));
  if (independentMin)
    query = query.gte('independent_score', Number(independentMin));
  if (independentMax)
    query = query.lte('independent_score', Number(independentMax));
  if (keyword) query = query.ilike('title', `%${keyword}%`);
  if (category) query = query.eq('category', category);

  // Recommendation list caps at 500 newest rows with score >=55
  const minScore = platformMin ? Number(platformMin) : null;
  if (minScore !== null && minScore >= 55) {
    if (from > 499) {
      await logInfo('rows fetched beyond cap', { fileId: id });
      return res.status(200).json({ rows: [], count: 0 });
    }
    to = Math.min(to, 499);
  }

  const { data, error, count } = await query
    .order('imported_at', { ascending: false })
    .range(from, to);

  if (!error) {
    const rows = data || [];

    // auto score rows missing scores
    const missing = rows.filter(
      (r: any) => r.platform_score == null || r.independent_score == null
    );
    if (missing.length) {
      const { computeScores } = await import('@/lib/scoring');
      for (const r of missing) {
        const scores = computeScores(r);
        await supabase
          .from('product_scores')
          .upsert({ row_id: r.row_id, ...scores });
        r.platform_score = scores.platform_score;
        r.independent_score = scores.independent_score;
      }
    }

    const total =
      minScore !== null && minScore >= 55
        ? Math.min(count ?? rows.length, 500)
        : count;
    await logInfo('rows fetched', { fileId: id, count: total });
    return res.status(200).json({ rows, count: total });
  }

  await logError('query v_blackbox_rows_with_scores failed', error);

  // Fallback: directly read from blackbox_rows without score columns.
  let alt = supabase
    .from('blackbox_rows')
    .select('*', { count: 'exact' })
    .eq('file_id', id);

  if (keyword) alt = alt.ilike('title', `%${keyword}%`);
  if (category) alt = alt.eq('category', category);

  const { data: raw, error: err2, count: cnt2 } = await alt
    .order('imported_at', { ascending: false })
    .range(from, to);

  if (err2) {
    await logError('query blackbox_rows failed', err2);
    return res.status(500).json({ error: err2.message });
  }

  const rows = (raw || []).map((r: any) => ({
    ...r,
    imported_at: r.imported_at ?? r.inserted_at ?? r.created_at ?? null,
    platform_score: null,
    independent_score: null,
  }));

  if (rows.length) {
    const { computeScores } = await import('@/lib/scoring');
    for (const r of rows) {
      const scores = computeScores(r);
      await supabase
        .from('product_scores')
        .upsert({ row_id: r.id, ...scores });
      r.platform_score = scores.platform_score;
      r.independent_score = scores.independent_score;
    }
  }

  await logInfo('rows fetched fallback', { fileId: id, count: cnt2 });
  return res.status(200).json({ rows, count: cnt2 });
}
