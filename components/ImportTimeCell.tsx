import React from "react";

interface Props {
  import_at?: string | null;
  insert_at?: string | null;
}

export default function ImportTimeCell({ import_at, insert_at }: Props) {
  const value = import_at || insert_at;
  if (!value) return <span>-</span>;
  const date = new Date(value);
  if (isNaN(date.getTime())) return <span>-</span>;
  return <span>{date.toLocaleDateString()}</span>;
}
