import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function ProductPage() {
  const router = useRouter();
  const { id } = router.query;
  const [row, setRow] = useState<any>(null);
  useEffect(() => {
    if (!id) return;
    fetch(`/api/row/${id}`)
      .then(res => res.json())
      .then(data => setRow(data.row));
  }, [id]);
  if (!row) return <p>Loading...</p>;
  const entries = Object.entries(row.data || {}).filter(
    ([k]) => !['ASIN', 'URL', 'Product Title'].includes(k)
  );
  return (
    <>
      <Head>
        <title>{row.title}</title>
      </Head>
      <main className="p-4 space-y-4">
        <h1 className="text-2xl font-bold">{row.title}</h1>
        {row.url && (
          <a
            href={row.url}
            className="text-blue-600"
            target="_blank"
            rel="noopener noreferrer"
          >
            {row.url}
          </a>
        )}
        <div className="border rounded p-4">
          <table className="min-w-full">
            <tbody>
              <tr>
                <th className="text-left pr-4">ASIN</th>
                <td>{row.asin || row.data?.ASIN}</td>
              </tr>
              <tr>
                <th className="text-left pr-4">Platform Score</th>
                <td>{row.platform_score?.toFixed?.(2) ?? ''}</td>
              </tr>
              <tr>
                <th className="text-left pr-4">Independent Score</th>
                <td>{row.independent_score?.toFixed?.(2) ?? ''}</td>
              </tr>
              {entries.map(([k, v]) => (
                <tr key={k}>
                  <th className="text-left pr-4">{k}</th>
                  <td>{String(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
