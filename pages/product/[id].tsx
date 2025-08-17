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
  return (
    <>
      <Head>
        <title>{row.title}</title>
      </Head>
      <main className="p-4 space-y-2">
        <h1 className="text-2xl font-bold">{row.title}</h1>
        <a href={row.url} className="text-blue-600" target="_blank" rel="noopener noreferrer">
          {row.url}
        </a>
        <pre className="whitespace-pre-wrap bg-gray-100 p-4 border">{JSON.stringify(row.data, null, 2)}</pre>
      </main>
    </>
  );
}
