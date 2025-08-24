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
    const { data: recs, error: recErr, count: recCount } = await supabase
      .from('recommendation_rows')
      .select('platform_score, independent_score, imported_at, blackbox_rows(*)', {
        count: 'exact',
      })
      .eq('file_id', id)
      .order('imported_at', { ascending: false })
      .range(from, Math.min(to, 499));
    if (!recErr) {
      const rows = (recs || []).map((r: any) => ({
        ...r.blackbox_rows,
        imported_at: r.imported_at,
        platform_score: r.platform_score,
        independent_score: r.independent_score,
      }));
      await logInfo('recommendations fetched', { fileId: id, count: rows.length });
      return res.status(200).json({
        rows,
        count: Math.min(recCount ?? rows.length, 500),
      });
    }
    await logError('query recommendation_rows failed', recErr);
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

  const { data: raw, error: err2 } = await alt.order('imported_at', {
    ascending: false,
  });

  if (err2) {
    await logError('query blackbox_rows failed', err2);
    return res.status(500).json({ error: err2.message });
  }

  let rows = raw || [];
  const enriched: any[] = [];
  if (rows.length) {
    const { computeScores } = await import('@/lib/scoring');
    for (const r of rows) {
      const row: any = {
        ...r,
        imported_at: r.imported_at ?? r.inserted_at ?? r.created_at ?? null,
      };
      const scores = computeScores(row);
      await supabase
        .from('product_scores')
        .upsert({ row_id: r.id, ...scores });
      row.platform_score = scores.platform_score;
      row.independent_score = scores.independent_score;
      if (platformMin && row.platform_score < Number(platformMin)) continue;
      if (platformMax && row.platform_score > Number(platformMax)) continue;
      if (independentMin && row.independent_score < Number(independentMin))
        continue;
      if (independentMax && row.independent_score > Number(independentMax))
        continue;
      enriched.push(row);
    }
  }

  if (minScore !== null && minScore >= 55) {
    rows = enriched.slice(0, 500);
  } else {
    rows = enriched;
  }
  const total = rows.length;
  const paged = rows.slice(from, from + limit);
  await logInfo('rows fetched fallback', { fileId: id, count: total });
  return res.status(200).json({ rows: paged, count: total });
}
