"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UploadForm({ onUploaded }: { onUploaded?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('blackbox');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('docType', docType);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      const { fileId, stats } = data;
      setMessage(
        `Uploaded: ${fileId} (inserted: ${stats.inserted}, skipped: ${stats.skipped}, invalid: ${stats.invalid})`
      );
      onUploaded?.();
      router.push(`/recommendations`);
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-2">
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={e => setFile(e.target.files?.[0] || null)}
          className="border p-2"
        />
        <select
          value={docType}
          onChange={e => setDocType(e.target.value)}
          className="border p-2"
        >
          <option value="blackbox">BlackBox</option>
          <option value="cerebro">Cerebro</option>
          <option value="semrush">Semrush</option>
        </select>
      </div>
      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
        Upload
      </button>
      {message && <p className="text-sm text-gray-600">{message}</p>}
    </form>
  );
}
