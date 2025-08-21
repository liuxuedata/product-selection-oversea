import ScoreBadge from "@/components/ScoreBadge";

async function getData(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/row/${id}`, {
    cache: "no-store",
  });
  const data = await res.json();
  return data.row;
}

export default async function ProductDetail({ params }: { params: { id: string } }) {
  const p = await getData(params.id);
  if (!p) return <div className="p-6">未找到该产品</div>;
  const d = p.data || {};

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        {d["图片 URL"] || d["Image URL"] ? (
          <img
            src={d["图片 URL"] || d["Image URL"]}
            className="w-20 h-20 rounded object-cover"
          />
        ) : null}
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{p.title}</h1>
          <div className="mt-2 flex gap-2">
            <ScoreBadge value={p.platform_score} />
            <ScoreBadge value={p.independent_score} />
          </div>
          {p.url && (
            <a
              href={p.url}
              target="_blank"
              className="text-sm underline text-[var(--muted-foreground)]"
            >
              查看原始链接
            </a>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="border border-[var(--border)] rounded p-4">
          <h2 className="font-semibold mb-3">基础信息</h2>
          <ul className="text-sm space-y-2">
            <li>ASIN：{p.asin}</li>
            <li>品牌：{d["品牌"] || d["Brand"]}</li>
            <li>价格：{d["价格"] || d["Price"]}</li>
            <li>评论：{d["评论数量"] || d["Review Count"]} / {d["评论评分"] || d["Review Rating"]}</li>
          </ul>
        </div>
        <div className="border border-[var(--border)] rounded p-4">
          <h2 className="font-semibold mb-3">更多指标</h2>
          <ul className="text-sm space-y-2">
            <li>配送方式：{d["配送方式"] || d["Shipping"]}</li>
            <li>卖家国家/地区：{d["卖家国家/地区"] || d["Seller Country"]}</li>
            <li>活跃卖家数量：{d["活跃卖家数量"] || d["Active Sellers"]}</li>
            <li>年龄（月）：{d["年龄（月）"] || d["Age (Months)"]}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
