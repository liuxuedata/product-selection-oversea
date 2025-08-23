import * as XLSX from 'xlsx';

export function parseExcelToRows(buffer: Buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });

  const columnSet = new Set<string>();
  json.forEach(r => Object.keys(r).forEach(k => columnSet.add(k)));
  const columns = Array.from(columnSet);

  return { sheetName, columns, rows: json };
}
