"use client";
import { useEffect, useState } from "react";
import UploadForm from "@/components/UploadForm";

type FileRow = {
  id: string;
  filename: string;
  doc_type: string;
  uploaded_at: string;
  row_count?: number;
  inserted_count?: number;
  status?: string;
};

export default function HomePage() {
  const [records, setRecords] = useState<FileRow[]>([]);

  const load = () => {
    fetch("/api/files")
      .then((r) => r.json())
      .then((data) => setRecords(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">产品导入</h1>
      <UploadForm onUploaded={load} />
      <div>
        <h2 className="text-xl font-semibold mb-2">上传记录</h2>
        <table className="w-full text-sm border border-[var(--border)]">
          <thead className="bg-[var(--muted)]">
            <tr>
              <th className="p-2 text-left">文件名</th>
              <th className="p-2 text-left">类型</th>
              <th className="p-2 text-left">上传时间</th>
              <th className="p-2 text-left">状态</th>
              <th className="p-2 text-right">录入条数</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-t border-[var(--border)]">
                <td className="p-2">{r.filename}</td>
                <td className="p-2">{r.doc_type}</td>
                <td className="p-2">{new Date(r.uploaded_at).toLocaleString()}</td>
                <td className="p-2">{r.status === 'completed' ? '导入完成' : '导入中...'}</td>
                <td className="p-2 text-right">{r.inserted_count ?? r.row_count ?? '-'}</td>
              </tr>
            ))}
            {!records.length && (
              <tr>
                <td className="p-2 text-center" colSpan={5}>
                  暂无记录
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
