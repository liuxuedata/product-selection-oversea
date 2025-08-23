import { scoreTag } from "@/utils/score";

const toneClasses: Record<string, string> = {
  success: "bg-[var(--badge-success-bg)] text-[var(--badge-success-fg)]",
  info: "bg-[var(--badge-info-bg)] text-[var(--badge-info-fg)]",
  warning: "bg-[var(--badge-warning-bg)] text-[var(--badge-warning-fg)]",
  neutral: "bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-fg)]",
};

export default function ScoreBadge({ value }: { value: number }) {
  const t = scoreTag(value ?? 0);
  const cls = toneClasses[t.tone];
  return (
    <span className={`px-2 py-0.5 rounded text-xs ${cls}`}>
      {value?.toFixed(1)} · {t.label}
    </span>
  );
}
