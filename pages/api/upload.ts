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
        data: r
      };

      const { error: insErr } = await supabase.from('blackbox_rows').insert(payload);
      if (insErr) {
        if ((insErr as any).code === '23505') { skipped++; continue; } // 唯一冲突 => 跳过
        throw insErr; // 其他错误直接抛
      }
      inserted++;
    }

    // 5) 将统计写回文件记录（忽略错误）
    await supabase
      .from('blackbox_files')
      .update({
        inserted_count: inserted,
        skipped_count: skipped,
        invalid_count: invalid,
      })
      .eq('id', fileRow.id);
    console.log('upload stats', { fileId: fileRow.id, inserted, skipped, invalid });

    // 6) 返回
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

