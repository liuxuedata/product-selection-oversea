"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UploadForm({ onUploaded }: { onUploaded?: () => void }) {
  const [docType, setDocType] = useState('blackbox');
  const [status, setStatus] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('docType', docType);

    setStatus('上传中...');
    setMessage('');

    try {
      const resp = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await resp.json().catch(() => ({ error: 'Upload failed' }));
      if (!resp.ok) {
        throw new Error(data.error || 'Upload failed');
      }
      if (data.fileId) {
        try {
          localStorage.setItem('pendingUploadFileId', data.fileId);
        } catch {}
      }
      setStatus('后台处理中');
      onUploaded?.();
      router.push('/recommendations');
    } catch (err: any) {
      setStatus('上传失败');
      setMessage(err.message || 'Upload failed');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      uploadFile(f);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
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

      {status && (
        <p className="text-sm text-gray-600">
          {status}
          {message && `，${message}`}
        </p>
      )}
    </div>
  );
}
