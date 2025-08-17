import type { NextApiRequest, NextApiResponse } from 'next';
import fs from "fs";
import formidable from 'formidable';
import { parseExcelToRows } from '../../utils/parseExcel';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const form = formidable({ keepExtensions: true });
  form.parse(req, async (err, fields, files) => {
    if (err) {
      res.status(500).json({ error: 'Upload error' });
      return;
    }
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file || !file.filepath) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    // Placeholder: parse excel and return stub fileId
    const buffer = await fs.promises.readFile(file.filepath);
    const parsed = parseExcelToRows(buffer);
    res.status(200).json({ fileId: 'demo', rows: parsed.rows.length });
  });
}
