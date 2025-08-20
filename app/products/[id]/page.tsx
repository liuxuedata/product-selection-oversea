import ScoreBadge from "@/components/ScoreBadge";

async function getData(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/mock/products.json`, {
    cache: "no-store",
  });
  const data = await res.json();
  const items = Array.isArray(data) ? data : data.items || [];
  return items.find((x: any) => x.id === id);
}

export default async function ProductDetail({ params }: { params: { id: string } }) {
  const p = await getData(params.id);
  if (!p) return <div className="p-6">未找到该产品</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <img src={p.image} className="w-20 h-20 rounded object-cover" />
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{p.title}</h1>
          <div className="mt-2">
            <ScoreBadge value={p.score} />
          </div>
          <a
            href={p.url}
            target="_blank"
            className="text-sm underline text-[var(--muted-foreground)]"
          >
            查看原始链接
          </a>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="border border-[var(--border)] rounded p-4">
          <h2 className="font-semibold mb-3">基础信息</h2>
          <ul className="text-sm space-y-2">
            <li>ASIN：{p.asin}</li>
            <li>父级：{p.parent_asin}</li>
            <li>价格：${p.price}</li>
            <li>销量(ASIN)：{p.asin_sales}</li>
            <li>评论：{p.review_count} / {p.review_rating}</li>
          </ul>
        </div>
        <div className="border border-[var(--border)] rounded p-4">
          <h2 className="font-semibold mb-3">更多指标</h2>
          <ul className="text-sm space-y-2">
            <li>卖家数：{p.seller_count}</li>
            <li>年龄（月）：{p.age_months}</li>
            <li>图片数：{p.image_count}</li>
            <li>变体数：{p.variant_count}</li>
            <li>同步时间：{p.synced_at}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
