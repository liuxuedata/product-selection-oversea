import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import type { File as FormidableFile, Files as FormidableFiles, Fields } from 'formidable';
import fs from 'fs';
import { supabase } from '@/lib/supabase';
import { parseExcelToRows } from '@/utils/parseExcel';

export const config = { api: { bodyParser: false } };

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
    const { file } = await parseForm(req);
    const buf = fs.readFileSync(file.filepath);
    const { sheetName, columns, rows } = parseExcelToRows(buf);

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

    const { data: task, error: taskErr } = await supabase
      .from('upload_tasks')
      .insert({ file_id: fileRow.id, rows, sheet_name: sheetName, columns })
      .select('id')
      .single();

    if (taskErr) {
      return res.status(500).json({ error: `Create task failed: ${taskErr.message}` });
    }

    return res.status(200).json({ taskId: task.id });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Upload failed' });
  }
}
