"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UploadForm({ onUploaded }: { onUploaded?: () => void }) {
  const [docType, setDocType] = useState('blackbox');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const uploadFile = (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('docType', docType);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');

    setStatus('上传中...');
    setMessage('');

    xhr.upload.onprogress = e => {
      if (e.lengthComputable) {
        const p = Math.round((e.loaded / e.total) * 100);
        setProgress(p);
        if (p === 100) {
          setStatus('加载中...');
        }
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          setStatus('完成');
          setMessage(`成功 ${data.stats.inserted} 条`);
          onUploaded?.();
          router.push(`/recommendations`);
        } else {
          setStatus('上传失败');
          setMessage(data.error || 'Upload failed');
        }
      } catch (err) {
        setStatus('上传失败');
        setMessage('Upload failed');
      } finally {
        setProgress(0);
      }
    };

    xhr.onerror = () => {
      setStatus('上传失败');
      setMessage('Upload failed');
      setProgress(0);
    };

    xhr.send(formData);
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

      {progress > 0 ? (
        <div>
          <div className="w-full bg-gray-200 h-2">
            <div
              className="bg-blue-600 h-2"
              style={{ width: `${progress}%` }}
            />
          </div>
          {status && <p className="text-sm text-gray-600 mt-1">{status}</p>}
        </div>
      ) : (
        status && (
          <p className="text-sm text-gray-600">
            {status}
            {message && `，${message}`}
          </p>
        )
      )}
    </div>
  );
}
