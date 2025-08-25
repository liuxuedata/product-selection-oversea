"use client";
import { useEffect, useState } from "react";

export default function UploadNotifier() {
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fileId = typeof window !== "undefined" ? localStorage.getItem("pendingUploadFileId") : null;
    if (!fileId) return;
    let attempts = 0;
    const timer = setInterval(async () => {
      attempts += 1;
      try {
        const res = await fetch(`/api/files/${fileId}`);
        if (res.ok) {
          const data = await res.json();
          const file = data.file;
          if (file) {
            const total =
              (file.inserted_count || 0) +
              (file.skipped_count || 0) +
              (file.invalid_count || 0);
            if (total > 0) {
              setMessage(`文件上传成功，更新${file.inserted_count || 0}条数据`);
              setOpen(true);
              clearInterval(timer);
              localStorage.removeItem("pendingUploadFileId");
              setTimeout(() => setOpen(false), 3000);
              return;
            }
          }
        } else {
          throw new Error("status request failed");
        }
      } catch {
        if (attempts > 20) {
          setMessage("文件上传失败");
          setOpen(true);
          clearInterval(timer);
          localStorage.removeItem("pendingUploadFileId");
          setTimeout(() => setOpen(false), 3000);
        }
      }
      if (attempts > 20) {
        setMessage("文件上传失败");
        setOpen(true);
        clearInterval(timer);
        localStorage.removeItem("pendingUploadFileId");
        setTimeout(() => setOpen(false), 3000);
      }
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  if (!message && !open) return null;
  return (
    <div
      className={`fixed top-4 right-4 bg-gray-800 text-white px-4 py-2 rounded shadow transition-transform duration-300 transform ${open ? 'translate-x-0' : 'translate-x-full'}`}
    >
      {message}
    </div>
  );
}
