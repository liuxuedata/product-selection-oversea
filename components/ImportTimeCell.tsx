import React from "react";

interface Props {
  import_at?: string | null;
  created_at?: string | null;
}

export default function ImportTimeCell({ import_at, created_at }: Props) {
  const value = import_at || created_at;
  if (!value) return <span>-</span>;
  const date = new Date(value);
  if (isNaN(date.getTime())) return <span>-</span>;
  return <span>{date.toLocaleString()}</span>;
}
