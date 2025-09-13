import { notFound } from "next/navigation";
import Image from "next/image";
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
      {product.image_url && (
        <div className="relative w-60 h-60">
          <Image
            src={product.image_url}
            alt={product.title || "product image"}
            fill
            className="object-contain"
          />
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>ASIN: {product.asin || "-"}</div>
        <div>品牌: {product.brand || "-"}</div>
        <div>价格: {product.price ?? "-"}</div>
        <div>分类: {product.category || "-"}</div>
        <div>评价数: {product.review_count ?? "-"}</div>
        <div>评价星级: {product.review_rating ?? "-"}</div>
        <div>运输: {product.shipping || "-"}</div>
        <div>
          平台评分: <ScoreBadge value={product.platform_score ?? 0} />
        </div>
        <div>
          独立站评分: <ScoreBadge value={product.independent_score ?? 0} />
        </div>
        <div>
          商品链接:
          {product.url ? (
            <a
              href={product.url}
              className="text-blue-600 underline ml-1"
              target="_blank"
              rel="noopener noreferrer"
            >
              查看
            </a>
          ) : (
            "-"
          )}
        </div>
      </div>
      <AiReview product={product} />
    </div>
  );
}
