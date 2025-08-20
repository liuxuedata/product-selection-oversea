import { scoreTag } from "@/utils/score";
export default function ScoreBadge({ value }: { value: number }) {
  const t = scoreTag(value ?? 0);
  return <span className={`px-2 py-0.5 rounded text-xs ${t.cls}`}>{value?.toFixed(1)} · {t.label}</span>;
}
