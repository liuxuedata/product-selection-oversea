import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import formidable from 'formidable';
import { supabase } from '@/lib/supabase';
import { parseExcelToRows } from '@/utils/parseExcel';
import { pickString } from '@/lib/scoring/field';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  const form = formidable({ keepExtensions: true });
  form.parse(req, async (err, _fields, files) => {
    if (err) {
      res.status(500).json({ error: 'Upload error' });
      return;
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file || !file.filepath) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const buffer = await fs.promises.readFile(file.filepath);
    const { sheetName, columns, rows } = parseExcelToRows(buffer);

    const { data: f, error: ferr } = await supabase
      .from('blackbox_files')
      .insert({
        filename: file.originalFilename,
        sheet_name: sheetName,
        row_count: rows.length,
        column_names: columns,
        uploaded_by: 'web',
      })
      .select('id')
      .single();

    if (ferr) {
      res.status(500).json({ error: ferr.message });
      return;
    }

    let inserted = 0,
      skipped = 0,
      invalid = 0;

    const seen = new Set<string>();
    const validRows: any[] = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const asin = pickString(r, ['ASIN', 'asin', 'Asin']);
      const url = pickString(r, ['URL', 'Url', 'url']);
      const title = pickString(r, ['Product Title', 'Title', 'title']);

      if (!asin && !url) {
        invalid++;
        continue;
      }

      const key = asin || url!;
      if (seen.has(key)) {
        skipped++;
        continue;
      }
      seen.add(key);

      validRows.push({
        file_id: f.id,
        row_index: i + 2,
        asin,
        url,
        title,
        data: r,
      });
    }

    if (validRows.length) {
      const { data: insertedRows, error: insErr } = await supabase
        .from('blackbox_rows')
        .insert(validRows, { onConflict: 'asin,url', ignoreDuplicates: true })
        .select('id');

      if (insErr) {
        res.status(500).json({ error: insErr.message });
        return;
      }

      inserted = insertedRows?.length || 0;
      skipped += validRows.length - inserted;
    }

    res.status(200).json({ fileId: f.id, stats: { inserted, skipped, invalid } });
  });
}
