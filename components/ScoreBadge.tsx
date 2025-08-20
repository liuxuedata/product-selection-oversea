import { scoreTag } from "@/utils/score";

export default function ScoreBadge({ value }: { value: number }) {
  const tag = scoreTag(value);
  const color = tag.tone === "success"
    ? "bg-green-100 text-green-700"
    : tag.tone === "info"
    ? "bg-blue-100 text-blue-700"
    : tag.tone === "warning"
    ? "bg-amber-100 text-amber-700"
    : "bg-gray-200 text-gray-700";
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      {value.toFixed(1)} · {tag.label}
    </span>
  );
}
