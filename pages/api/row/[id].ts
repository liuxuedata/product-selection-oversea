import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import mockProducts from '@/app/api/mock/products.json';
import { logError, logInfo } from '@/lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Method Not Allowed' });

  const { id } = req.query;

  const { data, error } = await supabase
    .from('v_blackbox_rows_with_scores')
    .select('*')
    .eq('row_id', id)
    .single();

  if (data) {
    await logInfo('row fetched', { id });
    return res.status(200).json({ row: data });
  }

  await logError('query v_blackbox_rows_with_scores failed', error);

  // Fallback to raw table if the view is unavailable
  const { data: raw, error: err2 } = await supabase
    .from('blackbox_rows')
    .select('*')
    .eq('id', id)
    .single();
  if (raw) {
    await logInfo('row fetched from blackbox_rows', { id });
    return res.status(200).json({
      row: {
        ...raw,
        imported_at: raw.imported_at ?? raw.inserted_at ?? raw.created_at ?? null,
        platform_score: null,
        independent_score: null,
      },
    });
  }

  const fallback = (mockProducts.items as any[]).find((r) => r.id === id);
  if (fallback) {
    await logInfo('row fetched from mock data', { id });
    return res.status(200).json({
      row: {
        row_id: fallback.id,
        url: fallback.url ?? null,
        image_url: fallback.image ?? null,
        asin: fallback.asin ?? null,
        title: fallback.title ?? null,
        brand: fallback.brand ?? null,
        shipping: fallback.shipping ?? null,
        category: fallback.category ?? null,
        price: fallback.price ?? null,
        review_count: fallback.review_count ?? null,
        review_rating: fallback.review_rating ?? null,
        third_party_seller: fallback.third_party_seller ?? null,
        seller_country: fallback.seller_country ?? null,
        active_seller_count: fallback.seller_count ?? null,
        size_tier: fallback.size ?? null,
        length: fallback.length ?? null,
        width: fallback.width ?? null,
        height: fallback.height ?? null,
        weight: fallback.weight_kg ?? null,
        age_months: fallback.age_months ?? null,
        platform_score: fallback.platform_score ?? fallback.score ?? null,
        independent_score: fallback.independent_score ?? null,
        imported_at: fallback.synced_at ?? null,
      },
    });
  }

  if (err2) {
    await logError('query blackbox_rows failed', err2);
    return res.status(500).json({ error: err2.message });
  }
  if (error) {
    await logError('query v_blackbox_rows_with_scores error', error);
    return res.status(500).json({ error: error.message });
  }
  await logError('row not found', { id });
  return res.status(404).json({ error: 'Not Found' });
}
