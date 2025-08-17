import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { File as FormidableFile } from 'formidable';
import fs from 'fs';
import { supabase } from '@/lib/supabase';
import { parseExcelToRows } from '@/utils/parseExcel';

// 关闭 Next 的内置 bodyParser，交给 formidable 处理表单
export const config = { api: { bodyParser: false } };

function pickString(row: Record<string, any>, keys: string[]) {
  for (const k of keys) {
    const v = row?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
  }
  return null;
}

async function parseForm(req: NextApiRequest): Promise<{ file: FormidableFile }> {
  const form = formidable({ multiples: false });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, _fields, files) => {
      if (err) return reject(err);
      const file = files.file as FormidableFile;
      if (!file) return reject(new Error('No file field "file" found'));
      resolve({ file });
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    // 1) 解析上传
    const { file } = await parseForm(req);
    const buf = fs.readFileSync(file.filepath);

    // 2) 解析 Excel/CSV -> 行数据
    const { sheetName, columns, rows } = parseExcelToRows(buf);

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

    // 4) 逐行插入（命中 asin_norm 或 url_norm 的任一唯一索引冲突 → 跳过）
    let inserted = 0, skipped = 0, invalid = 0;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const asin  = pickString(r, ['ASIN','asin','Asin']);
      const url   = pickString(r, ['URL','Url','url','Product URL','Product Url']);
      const title = pickString(r, ['Product Title','Title','title']);

      if (!asin && !url) { invalid++; continue; }

      const payload = {
        file_id: fileRow.id,
        row_index: i + 2, // 约定：含表头时的数据行 +2 更易回查
        asin,
        url,
        title,
        data: r
      };

      const { error: insErr } = await supabase.from('blackbox_rows').insert(payload);
      if (insErr) {
        // 23505: unique_violation（asin_norm 或 url_norm 任一重复）
        if ((insErr as any).code === '23505') { skipped++; continue; }
        // 其他错误直接抛出，避免静默失败
        throw insErr;
      }
      inserted++;
    }

    // 5) 返回结果（可由前端触发 /api/score/apply 计算评分并跳转）
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

