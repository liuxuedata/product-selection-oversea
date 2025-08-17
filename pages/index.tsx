import Head from 'next/head';
import UploadForm from '@/components/UploadForm';

export default function Home() {
  return (
    <>
      <Head>
        <title>Product Selection Platform</title>
      </Head>
      <main className="p-8">
        <h1 className="text-2xl font-bold mb-4">Upload BlackBox File</h1>
        <UploadForm />
      </main>
    </>
  );
}
