import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function FilePage() {
  const router = useRouter();
  const { id, scheme = 'platform', minScore = '0' } = router.query as {
    id?: string;
    scheme?: string;
    minScore?: string;
  };
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    if (!id) return;
    fetch(`/api/files/${id}/rows`)
      .then(res => res.json())
      .then(data => setRows(data.rows || []));
  }, [id]);
  const scoreKey = `${scheme}_score` as 'platform_score' | 'independent_score';
  const min = Number(minScore);

  return (
    <>
      <Head>
        <title>File {id}</title>
      </Head>
      <main className="p-4">
        <h1 className="text-xl font-bold mb-4">File {id}</h1>
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">ASIN</th>
              <th className="p-2 border">Title</th>
              <th className="p-2 border">Score</th>
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
                    <td className="p-2 border">{r.asin}</td>
                    <td className="p-2 border">{r.title}</td>
                    <td className="p-2 border">{score.toFixed(2)}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </main>
    </>
  );
}
