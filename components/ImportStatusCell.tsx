import React from "react";

export default function ImportStatusCell({ status }: { status?: string | null }) {
  return <span>{status === 'completed' ? '产品导入完成' : '产品导入中...'}</span>;
}
