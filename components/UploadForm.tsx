"use client";
import { useState, useEffect, useRef, useCallback } from 'react';

export default function UploadForm({ onUploaded }: { onUploaded?: () => void }) {
  const [docType, setDocType] = useState('blackbox');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [message, setMessage] = useState('');
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const pollTask = useCallback((id: string) => {
    localStorage.setItem('uploadTaskId', id);
    timer.current && clearInterval(timer.current);
    timer.current = setInterval(async () => {
      try {
        const info = await fetch(`/api/upload/tasks/${id}`).then(r => r.json());
        setProgress(info.progress ?? 0);
        setStatus(
          info.status === 'processing'
            ? '产品导入中，敬请等待...'
            : info.status
        );
        if (info.status === 'done') {
          clearInterval(timer.current!);
          localStorage.removeItem('uploadTaskId');
          setMessage('完成');
          onUploaded?.();
        } else if (info.status === 'error') {
          clearInterval(timer.current!);
          localStorage.removeItem('uploadTaskId');
          setMessage(info.error || '任务失败');
        }
      } catch (e) {
        // ignore polling errors
      }
    }, 1000);
  }, [onUploaded]);

  useEffect(() => {
    const existing = localStorage.getItem('uploadTaskId');
    if (existing) {
      pollTask(existing);
    }
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [pollTask]);

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
          setStatus('产品导入中，敬请等待...');
        } else {
          setStatus('上传中...');
        }
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          setStatus('任务已创建');
          setMessage(`任务 ID: ${data.taskId}`);
          setProgress(0);
          pollTask(data.taskId);
        } else {
          setStatus('上传失败');
          setMessage(data.error || 'Upload failed');
          setProgress(0);
        }
      } catch (err) {
        setStatus('上传失败');
        setMessage('Upload failed');
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

      {progress > 0 || status.startsWith('产品导入中') ? (
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
