import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import type { File as FormidableFile, Files as FormidableFiles, Fields } from 'formidable';
import fs from 'fs';
import { supabase } from '@/lib/supabase';
import { parseExcelToRows } from '@/utils/parseExcel';
import { computeScores } from '@/lib/scoring';

// 关闭 Next 自带 bodyParser，交给 formidable
export const config = { api: { bodyParser: false } };

function pickString(row: Record<string, any>, keys: string[]) {
  for (const k of keys) {
    const v = row?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
  }
  return null;
}

function pickNumber(row: Record<string, any>, keys: string[]) {
  const s = pickString(row, keys);
  if (s === null) return null;
  const n = parseFloat(String(s).replace(/[^0-9\.\-]/g, ''));
  return Number.isNaN(n) ? null : n;
}

// 关键修复：把 files.file 的 File | File[] | undefined 收窄为单个 FormidableFile
async function parseForm(req: NextApiRequest): Promise<{ file: FormidableFile; fields: Fields }> {
  const form = formidable({ multiples: false });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);

      const fset = files as FormidableFiles;
      const maybe = fset['file'] as FormidableFile | FormidableFile[] | undefined;

      let file: FormidableFile | undefined;
      if (Array.isArray(maybe)) file = maybe[0];
      else file = maybe;

      if (!file) return reject(new Error('No file field "file" found'));
      return resolve({ file, fields });
    });
  });
}

async function asyncMapLimit<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const ret: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array(Math.min(limit, items.length))
      .fill(0)
      .map(async () => {
        while (i < items.length) {
          const cur = i++;
          ret[cur] = await fn(items[cur], cur);
        }
      })
  );
  return ret;
}

async function processRows(fileId: number, rows: any[]) {
  const BATCH_SIZE = 100;
  const IMAGE_CONCURRENCY = 5;
  let inserted = 0,
    skipped = 0,
    invalid = 0;

  for (let offset = 0; offset < rows.length; offset += BATCH_SIZE) {
    const slice = rows.slice(offset, offset + BATCH_SIZE);
    const processed = await asyncMapLimit(slice, IMAGE_CONCURRENCY, async (r, idx) => {
      const asin = pickString(r, ['ASIN', 'asin', 'Asin']);
      const url = pickString(r, [
        'URL',
        'Url',
        'url',
        'Product URL',
        'Product Url',
        '产品链接',
        '产品 URL',
        '产品URL',
        '链接',
        'Link',
      ]);
      const title = pickString(r, ['Product Title', 'Title', 'title', '产品标题', '产品名称', '标题', 'Product Name']);

      if (!asin && !url) return { invalid: true };

      const rawImage = pickString(r, ['图片 URL', '图片URL', '图片链接', 'Image URL', 'ImageURL', 'Image Link', 'image']);
      let image_url = rawImage;
      if (rawImage && /^https?:/i.test(rawImage)) {
        try {
          const resp = await fetch(rawImage);
          if (resp.ok) {
            const contentType = resp.headers.get('content-type') || 'image/jpeg';
            const ext = contentType.split('/').pop()?.split(';')[0] || 'jpg';
            const buffer = Buffer.from(await resp.arrayBuffer());
            const filePath = `products/${Date.now()}_${offset + idx}.${ext}`;
            const { error: uploadErr } = await supabase.storage
              .from('product-images')
              .upload(filePath, buffer, { contentType, upsert: true });
            if (!uploadErr) {
              const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
              image_url = data.publicUrl;
            }
          }
        } catch (e) {
          console.error('image download failed', rawImage, e);
        }
      }

      const payload: any = {
        file_id: fileId,
        row_index: offset + idx + 2,
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
        price_trend_90d: pickNumber(r, [
          '价格趋势（90 天） (%)',
          '价格趋势（90天） (%)',
          'Price Trend (90d) (%)',
          'Price Trend 90d (%)',
        ]),
        parent_sales: pickNumber(r, ['父级销量', 'Parent Sales', '父商品销量']),
        asin_sales: pickNumber(r, ['ASIN 销量', 'ASIN Sales', 'Asin Sales']),
        sales_trend_90d: pickNumber(r, [
          '销量趋势（90 天） (%)',
          '销量趋势（90天） (%)',
          'Sales Trend (90d) (%)',
          'Sales Trend 90d (%)',
        ]),
        parent_revenue: pickNumber(r, ['父级收入', 'Parent Revenue', '父商品收入', 'ParentRevenue']),
        asin_revenue: pickNumber(r, ['ASIN 收入', 'ASIN Revenue', 'Asin Revenue', 'ASIN收入']),
        review_count: pickNumber(r, ['评论数量', 'Review Count', '评价数量', 'Reviews']),
        review_rating: pickNumber(r, ['评论评分', 'Review Rating', '评分', 'Rating', 'Review Score']),
        third_party_seller: pickString(r, ['第三方卖家', 'Third Party Seller', 'Third-Party Seller']),
        seller_country: pickString(r, [
          '卖家国家/地区',
          'Seller Country',
          'Seller Country/Region',
          'Seller Country/Area',
          '卖家国家',
        ]),
        active_seller_count: pickNumber(r, ['活跃卖家数量', 'Active Sellers', 'Active Seller Count', '活跃卖家数']),
        last_year_sales: pickNumber(r, ['去年销量', 'Last Year Sales', '去年销售量', 'Sales Last Year']),
        yoy_sales_percent: pickNumber(r, ['销量年同比 (%)', '销量年同比(%)', 'YoY Sales (%)', 'Sales YoY (%)']),
        size_tier: pickString(r, ['尺寸分级', 'Size Tier', 'Size', '尺寸等级', 'Size tier']),
        length: pickNumber(r, ['长度', 'Length', '长', 'length']),
        width: pickNumber(r, ['宽度', 'Width', '宽', 'width']),
        height: pickNumber(r, ['高度', 'Height', '高', 'height']),
        weight: pickNumber(r, ['重量', 'Weight', 'weight']),
        storage_fee_jan_sep: pickNumber(r, [
          '仓储费用 (1 月 - 9 月)',
          '仓储费用 (1月-9月)',
          'Storage Fee (Jan-Sep)',
          'Storage Fee Jan-Sep',
        ]),
        storage_fee_oct_dec: pickNumber(r, [
          '仓储费用 (10 月 - 12 月)',
          '仓储费用 (10月-12月)',
          'Storage Fee (Oct-Dec)',
          'Storage Fee Oct-Dec',
        ]),
        best_sales_period: pickString(r, ['最佳销售期', 'Best Sales Period', '最佳销售时期', 'Best-Selling Period']),
        age_months: pickNumber(r, ['年龄（月）', '年龄(月)', 'Age (Months)', 'Age Months', 'Age']),
        image_count: pickNumber(r, ['图片的数量', 'Image Count', '图片数量', 'Image Qty']),
        variant_count: pickNumber(r, ['变体数量', 'Variant Count', '变体数', 'Variant Qty']),
        sales_review_ratio: pickNumber(r, ['销量评论比', 'Sales/Review Ratio', '销量/评论比', 'Sales Review Ratio']),
        data: r,
      };
      return { payload };
    });

    const validPayloads = processed.filter((p) => !p.invalid).map((p) => p.payload);
    invalid += processed.filter((p) => p.invalid).length;

    if (validPayloads.length === 0) continue;

    const { data: insertedRows, error: batchErr } = await supabase
      .from('blackbox_rows')
      .insert(validPayloads)
      .select('id');

    if (batchErr) {
      // fallback to single inserts to detect duplicates
      for (const payload of validPayloads) {
        const { data: row, error: insErr } = await supabase
          .from('blackbox_rows')
          .insert(payload)
          .select('id')
          .single();
        if (insErr) {
          if ((insErr as any).code === '23505') {
            // duplicate exists – check if old record is stale (>5 months)
            const { data: existing } = await supabase
              .from('blackbox_rows')
              .select('id, created_at')
              .eq('asin', payload.asin)
              .eq('url', payload.url)
              .single();

            const FIVE_MONTHS_MS = 1000 * 60 * 60 * 24 * 30 * 5;
            const createdAt = existing?.created_at ? new Date(existing.created_at) : null;
            if (createdAt && Date.now() - createdAt.getTime() > FIVE_MONTHS_MS) {
              const { data: updated, error: updErr } = await supabase
                .from('blackbox_rows')
                .update({ ...payload, created_at: new Date().toISOString() })
                .eq('id', existing.id)
                .select('id')
                .single();
              if (!updErr && updated) {
                const scores = computeScores(payload);
                await supabase
                  .from('product_scores')
                  .upsert({ row_id: existing.id, ...scores });
                inserted++;
                continue;
              }
            }
            skipped++;
            continue;
          }
          throw insErr;
        }
        const scores = computeScores(payload);
        await supabase.from('product_scores').upsert({ row_id: row.id, ...scores });
        inserted++;
      }
    } else if (insertedRows && insertedRows.length > 0) {
      const scoresBatch = insertedRows.map((r, i) => ({ row_id: r.id, ...computeScores(validPayloads[i]) }));
      await supabase.from('product_scores').upsert(scoresBatch);
      inserted += insertedRows.length;
    }

    await supabase
      .from('blackbox_files')
      .update({ inserted_count: inserted, skipped_count: skipped, invalid_count: invalid })
      .eq('id', fileId);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    // 1) 解析上传
    const { file } = await parseForm(req);
    const buf = fs.readFileSync(file.filepath);

    // 2) 解析 Excel/CSV
    const { sheetName, columns, rows } = parseExcelToRows(buf);
    console.log('parsed upload', file.originalFilename, 'rows', rows.length);

    // 3) 记录文件元数据
    const { data: fileRow, error: fileErr } = await supabase
      .from('blackbox_files')
      .insert({
        filename: file.originalFilename || 'upload.xlsx',
        sheet_name: sheetName,
        row_count: rows.length,
        column_names: columns,
      })
      .select('id')
      .single();

    if (fileErr) {
      return res.status(500).json({ error: `Insert file meta failed: ${fileErr.message}` });
    }
    console.log('file meta inserted', fileRow.id);

        // 4) 异步处理行
    processRows(fileRow.id, rows).catch((e) => console.error('process rows failed', e));

    // 5) 立即返回任务 ID
    return res.status(202).json({
      fileId: fileRow.id,
      rowCount: rows.length,
      sheetName,
      columns,
    });

  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Upload failed' });
  }
}

