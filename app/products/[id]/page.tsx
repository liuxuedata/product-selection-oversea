import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ScoreBadge from "@/components/ScoreBadge";
import AiReview from "@/components/AiReview";

async function fetchProduct(id: string) {
  const { data } = await supabase
    .from("v_blackbox_rows_with_scores")
    .select("*")
    .eq("row_id", id)
    .maybeSingle();
  return data;
}

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = await fetchProduct(params.id);
  if (!product) return notFound();

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">{product.title || "产品详情"}</h1>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>ASIN: {product.asin || "-"}</div>
        <div>品牌: {product.brand || "-"}</div>
        <div>价格: {product.price ?? "-"}</div>
        <div>
          平台评分: <ScoreBadge value={product.platform_score ?? 0} />
        </div>
        <div>
          独立站评分: <ScoreBadge value={product.independent_score ?? 0} />
        </div>
      </div>
      <AiReview product={product} />
    </div>
  );
}
