import ScoreBadge from "@/components/ScoreBadge";
import ImportTimeCell from "@/components/ImportTimeCell";

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        {p.image_url ? (
          <img
            src={p.image_url}
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
            <li>品牌：{p.brand}</li>
            <li>价格：{p.price}</li>
            <li>评论：{p.review_count} / {p.review_rating}</li>
            <li>
              录入时间：<ImportTimeCell import_at={p.import_at} insert_at={p.insert_at} />
            </li>
          </ul>
        </div>
        <div className="border border-[var(--border)] rounded p-4">
          <h2 className="font-semibold mb-3">更多指标</h2>
          <ul className="text-sm space-y-2">
            <li>配送方式：{p.shipping}</li>
            <li>卖家国家/地区：{p.seller_country}</li>
            <li>活跃卖家数量：{p.active_seller_count}</li>
            <li>年龄（月）：{p.age_months}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
