import { supabase } from '@/lib/supabase';
import { computeScores } from '@/lib/scoring';

function pickString(row: Record<string, any>, keys: string[]): string | null {
  for (const k of keys) {
    const v = row?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
  }
  return null;
}

function pickNumber(row: Record<string, any>, keys: string[]): number | null {
  const s = pickString(row, keys);
  if (s === null) return null;
  const n = parseFloat(String(s).replace(/[^0-9\.\-]/g, ''));
  return Number.isNaN(n) ? null : n;
}

export async function processRows(fileId: string, rows: any[]) {
  let inserted = 0, skipped = 0, invalid = 0;
  await supabase.from('blackbox_files').update({ status: 'processing' }).eq('id', fileId);

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const asin = pickString(r, ['ASIN', 'asin', 'Asin']);
    const url = pickString(r, ['URL', 'Url', 'url', 'Product URL', 'Product Url', '产品链接', '产品 URL', '产品URL', '链接', 'Link']);
    const title = pickString(r, ['Product Title', 'Title', 'title', '产品标题', '产品名称', '标题', 'Product Name']);

    if (!asin && !url) { invalid++; continue; }

    const rawImage = pickString(r, ['图片 URL', '图片URL', '图片链接', 'Image URL', 'ImageURL', 'Image Link', 'image']);
    let image_url = rawImage;
    if (rawImage && /^https?:/i.test(rawImage)) {
      try {
        const resp = await fetch(rawImage);
        if (resp.ok) {
          const contentType = resp.headers.get('content-type') || 'image/jpeg';
          const ext = contentType.split('/').pop()?.split(';')[0] || 'jpg';
          const buffer = Buffer.from(await resp.arrayBuffer());
          const filePath = `products/${Date.now()}_${i}.${ext}`;
          const { error: uploadErr } = await supabase.storage
            .from('product-images')
            .upload(filePath, buffer, { contentType, upsert: true });
          if (!uploadErr) {
            const { data } = supabase.storage
              .from('product-images')
              .getPublicUrl(filePath);
            image_url = data.publicUrl;
          }
        }
      } catch (e) {
        console.error('image download failed', rawImage, e);
      }
    }

    const payload = {
      file_id: fileId,
      row_index: i + 2,
      asin,
      url,
      title,
      image_url,
      brand: pickString(r, ['品牌', 'Brand', '品牌名称', 'Brand Name']),
      shipping: pickString(r, ['配送方式', 'Shipping', 'Shipping Method', '发货方式']),
      category: pickString(r, ['类目', 'Category', '分类', '类别', 'Category Name']),
      bsr: pickNumber(r, ['BSR', 'BSR Rank', 'Best Seller Rank', 'BSR 排名']),
      upc: pickString(r, ['UPC', 'upc', 'UPC Code']),
      gtin: pickString(r, ['GTIN', 'gtin', 'GTIN Code']),
      ean: pickString(r, ['EAN', 'ean', 'EAN Code']),
      isbn: pickString(r, ['ISBN', 'isbn', 'ISBN Code']),
      sub_category: pickString(r, ['子类目', 'Subcategory', '子类别', 'Sub Category', 'subcategory']),
      sub_category_bsr: pickNumber(r, ['子类目BSR', 'Subcategory BSR', '子类别BSR', 'Sub Category BSR']),
      price: pickNumber(r, ['价格', 'Price', '售价', 'price']),
      price_trend_90d: pickNumber(r, ['价格趋势（90 天） (%)', '价格趋势（90天） (%)', 'Price Trend (90d) (%)', 'Price Trend 90d (%)']),
      parent_sales: pickNumber(r, ['父级销量', 'Parent Sales', '父商品销量']),
      asin_sales: pickNumber(r, ['ASIN 销量', 'ASIN Sales', 'Asin Sales']),
      sales_trend_90d: pickNumber(r, ['销量趋势（90 天） (%)', '销量趋势（90天） (%)', 'Sales Trend (90d) (%)', 'Sales Trend 90d (%)']),
      parent_revenue: pickNumber(r, ['父级收入', 'Parent Revenue', '父商品收入', 'ParentRevenue']),
      asin_revenue: pickNumber(r, ['ASIN 收入', 'ASIN Revenue', 'Asin Revenue', 'ASIN收入']),
      review_count: pickNumber(r, ['评论数量', 'Review Count', '评价数量', 'Reviews']),
      review_rating: pickNumber(r, ['评论评分', 'Review Rating', '评分', 'Rating', 'Review Score']),
      third_party_seller: pickString(r, ['第三方卖家', 'Third Party Seller', 'Third-Party Seller']),
      seller_country: pickString(r, ['卖家国家/地区', 'Seller Country', 'Seller Country/Region', 'Seller Country/Area', '卖家国家']),
      active_seller_count: pickNumber(r, ['跃卖家数量', 'Active Sellers', 'Active Seller Count', '活跃卖家数']),
      last_year_sales: pickNumber(r, ['去年销量', 'Last Year Sales', '去年销售量', 'Sales Last Year']),
      yoy_sales_percent: pickNumber(r, ['销量年同比 (%)', '销量年同比(%)', 'YoY Sales (%)', 'Sales YoY (%)']),
      size_tier: pickString(r, ['尺寸分级', 'Size Tier', 'Size', '尺寸等级', 'Size tier']),
      length: pickNumber(r, ['长度', 'Length', '长', 'length']),
      width: pickNumber(r, ['宽度', 'Width', '宽', 'width']),
      height: pickNumber(r, ['高度', 'Height', '高', 'height']),
      weight: pickNumber(r, ['重量', 'Weight', 'weight']),
      storage_fee_jan_sep: pickNumber(r, ['仓储费用 (1 月 - 9 月)', '仓储费用 (1月-9月)', 'Storage Fee (Jan-Sep)', 'Storage Fee Jan-Sep']),
      storage_fee_oct_dec: pickNumber(r, ['仓储费用 (10 月 - 12 月)', '仓储费用 (10月-12月)', 'Storage Fee (Oct-Dec)', 'Storage Fee Oct-Dec']),
      best_sales_period: pickString(r, ['最佳销售期', 'Best Sales Period', '最佳销售时期', 'Best-Selling Period']),
      age_months: pickNumber(r, ['年龄（月）', '年龄(月)', 'Age (Months)', 'Age Months', 'Age']),
      image_count: pickNumber(r, ['图片的数量', 'Image Count', '图片数量', 'Image Qty']),
      variant_count: pickNumber(r, ['变体数量', 'Variant Count', '变体数', 'Variant Qty']),
      sales_review_ratio: pickNumber(r, ['销量评论比', 'Sales/Review Ratio', '销量/评论比', 'Sales Review Ratio']),
      data: r
    };

    const { data: insertedRow, error: insErr } = await supabase
      .from('blackbox_rows')
      .insert(payload)
      .select('id')
      .single();
    if (insErr) {
      if ((insErr as any).code === '23505') { skipped++; continue; }
      throw insErr;
    }

    const scores = computeScores(payload);
    if (scores.platform_score === 0 && scores.independent_score === 0) {
      await supabase.from('blackbox_rows').delete().eq('id', insertedRow.id);
      invalid++;
      continue;
    }
    await supabase.from('product_scores').upsert({ row_id: insertedRow.id, ...scores });
    inserted++;
  }

  await supabase
    .from('blackbox_files')
    .update({
      inserted_count: inserted,
      skipped_count: skipped,
      invalid_count: invalid,
      status: 'done',
      processed_at: new Date().toISOString(),
    })
    .eq('id', fileId);

  return { inserted, skipped, invalid };
}

async function processTasks() {
  const { data: tasks, error } = await supabase
    .from('upload_tasks')
    .select('*')
    .eq('status', 'pending')
    .limit(10);

  if (error || !tasks) return;

  for (const task of tasks) {
    await supabase.from('upload_tasks').update({ status: 'processing', started_at: new Date().toISOString() }).eq('id', task.id);
    try {
      const stats = await processRows(task.file_id, task.rows);
      await supabase
        .from('upload_tasks')
        .update({ status: 'done', finished_at: new Date().toISOString(), result: stats })
        .eq('id', task.id);
    } catch (err: any) {
      await supabase
        .from('upload_tasks')
        .update({ status: 'error', error: err?.message, finished_at: new Date().toISOString() })
        .eq('id', task.id);
    }
  }
}

setInterval(processTasks, 5000);

// Trigger once on start
processTasks();
