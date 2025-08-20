import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState, useMemo } from 'react';

export default function RecommendedPage() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/files/${id}/rows`)
      .then(res => res.json())
      .then(data => setRows(data.rows || []));
  }, [id]);

  const scoreKey = 'platform_score';
  const min = 55;

  const columns = useMemo(() => {
    const set = new Set<string>();
    rows.forEach(r => Object.keys(r.data || {}).forEach(k => set.add(k)));
    const cols = Array.from(set);
    return [
      'ASIN',
      'URL',
      'Product Title',
      ...cols.filter(c => !['ASIN', 'URL', 'Product Title'].includes(c)),
      'platform_score',
      'independent_score',
    ];
  }, [rows]);

  return (
    <>
      <Head>
        <title>Recommended Products for File {id}</title>
      </Head>
      <main className="p-4">
        <h1 className="text-xl font-bold mb-4">Recommended Products for File {id}</h1>
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100">
              {columns.map(c => (
                <th key={c} className="p-2 border">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows
              .filter((r: any) => (r[scoreKey] ?? 0) >= min)
              .map((r: any) => {
                const score = r[scoreKey] ?? 0;
                let color = '';
                if (score >= 85) color = 'bg-red-100';
                else if (score >= 70) color = 'bg-green-100';
                else if (score >= 55) color = 'bg-orange-100';
                return (
                  <tr
                    key={r.row_id}
                    className={color + ' cursor-pointer'}
                    onClick={() => router.push(`/product/${r.row_id}`)}
                  >
                    {columns.map(c => {
                      let value: any = '';
                      if (c === 'ASIN') value = r.asin || r.data?.ASIN || '';
                      else if (c === 'URL')
                        value = (
                          <a
                            href={r.url || r.data?.URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline"
                            onClick={e => e.stopPropagation()}
                          >
                            {r.url || r.data?.URL || ''}
                          </a>
                        );
                      else if (c === 'Product Title')
                        value = r.title || r.data?.['Product Title'] || '';
                      else if (c === 'platform_score' || c === 'independent_score')
                        value = (r as any)[c]?.toFixed?.(2) ?? '';
                      else value = String(r.data?.[c] ?? '');
                      return (
                        <td key={c} className="p-2 border">
                          {value}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </main>
    </>
  );
}

