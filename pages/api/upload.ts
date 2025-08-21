import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import type { File as FormidableFile, Files as FormidableFiles, Fields } from 'formidable';
import fs from 'fs';
import { supabase } from '@/lib/supabase';
import { parseExcelToRows } from '@/utils/parseExcel';

// 关闭 Next 自带 bodyParser，交给 formidable
export const config = { api: { bodyParser: false } };

function pickString(row: Record<string, any>, keys: string[]) {
  for (const k of keys) {
    const v = row?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
  }
  return null;
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    // 1) 解析上传
    const { file, fields } = await parseForm(req);
    const buf = fs.readFileSync(file.filepath);
    const rawType = fields.docType as string | string[] | undefined;
    const docType = Array.isArray(rawType) ? rawType[0] : rawType || 'unknown';

    // 2) 解析 Excel/CSV
    const { sheetName, columns, rows } = parseExcelToRows(buf);

    // 3) 记录文件元数据
    const { data: fileRow, error: fileErr } = await supabase
      .from('blackbox_files')
      .insert({
        filename: file.originalFilename || 'upload.xlsx',
        sheet_name: sheetName,
        row_count: rows.length,
        column_names: columns,
        doc_type: docType,
      })
      .select('id')
      .single();

    if (fileErr) {
      return res.status(500).json({ error: `Insert file meta failed: ${fileErr.message}` });
    }

    // 4) 逐行插入（命中 asin_norm / url_norm 的唯一索引冲突 => 跳过）
    let inserted = 0, skipped = 0, invalid = 0;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const asin  = pickString(r, ['ASIN','asin','Asin']);
      const url   = pickString(r, ['URL','Url','url','Product URL','Product Url']);
      const title = pickString(r, ['Product Title','Title','title']);

      if (!asin && !url) { invalid++; continue; }

      const payload = {
        file_id: fileRow.id,
        row_index: i + 2, // 约定：含表头时的数据行 +2 便于回查
        asin,
        url,
        title,
        image_url: r['图片 URL'] ?? r['Image URL'] ?? null,
        brand: r['品牌'] ?? null,
        fulfillment: r['配送方式'] ?? null,
        category: r['类目'] ?? null,
        bsr: r['BSR'] ?? null,
        upc: r['UPC'] ?? null,
        gtin: r['GTIN'] ?? null,
        ean: r['EAN'] ?? null,
        isbn: r['ISBN'] ?? null,
        subcategory: r['子类目'] ?? null,
        subcategory_bsr: r['子类目BSR'] ?? null,
        price: r['价格'] ?? null,
        price_trend_90d: r['价格趋势（90 天） (%)'] ?? null,
        parent_sales: r['父级销量'] ?? null,
        asin_sales: r['ASIN 销量'] ?? null,
        sales_trend_90d: r['销量趋势（90 天） (%)'] ?? null,
        parent_revenue: r['父级收入'] ?? null,
        asin_revenue: r['ASIN 收入'] ?? null,
        review_count: r['评论数量'] ?? null,
        review_rating: r['评论评分'] ?? null,
        third_party_sellers: r['第三方卖家'] ?? null,
        seller_country: r['卖家国家/地区'] ?? null,
        active_sellers: r['活跃卖家数量'] ?? null,
        last_year_sales: r['去年销量'] ?? null,
        sales_yoy: r['销量年同比 (%)'] ?? null,
        size_tier: r['尺寸分级'] ?? null,
        length: r['长度'] ?? null,
        width: r['宽度'] ?? null,
        height: r['高度'] ?? null,
        weight: r['重量'] ?? null,
        storage_fee_jan_sep: r['仓储费用 (1 月 - 9 月)'] ?? null,
        storage_fee_oct_dec: r['仓储费用 (10 月 - 12 月)'] ?? null,
        best_sales_period: r['最佳销售期'] ?? null,
        age_months: r['年龄（月）'] ?? null,
        image_count: r['图片的数量'] ?? null,
        variant_count: r['变体数量'] ?? null,
        sales_review_ratio: r['销量评论比'] ?? null,
        data: r
      };

      const { error: insErr } = await supabase.from('blackbox_rows').insert(payload);
      if (insErr) {
        if ((insErr as any).code === '23505') { skipped++; continue; } // 唯一冲突 => 跳过
        throw insErr; // 其他错误直接抛
      }
      inserted++;
    }

    // 5) 返回
    return res.status(200).json({
      fileId: fileRow.id,
      stats: { inserted, skipped, invalid, total: rows.length },
      sheetName,
      columns
    });

  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Upload failed' });
  }
}

