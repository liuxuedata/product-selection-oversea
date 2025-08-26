import ScoreBadge from "@/components/ScoreBadge";

export default function TrendDetailPage({
  params,
}: {
  params: { keyword: string };
}) {
  const keyword = decodeURIComponent(params.keyword);
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">{keyword}</h1>

      <section>
        <h2 className="text-xl mb-2">趋势曲线</h2>
        <div className="h-64 border border-[var(--border)] flex items-center justify-center text-sm text-muted-foreground">
          Google vs TikTok trend chart
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border border-[var(--border)] rounded">
          <h3 className="font-medium mb-2">Google</h3>
          <p className="mb-1">
            Score: <ScoreBadge value={80} />
          </p>
          <p className="mb-1">Rank: 10</p>
          <p className="text-sm text-muted-foreground">环比变化: --</p>
        </div>
        <div className="p-4 border border-[var(--border)] rounded">
          <h3 className="font-medium mb-2">TikTok</h3>
          <p className="mb-1">
            Score: <ScoreBadge value={75} />
          </p>
          <p className="mb-1">Rank: 8</p>
          <p className="text-sm text-muted-foreground">环比变化: --</p>
        </div>
      </section>
    </div>
  );
}

