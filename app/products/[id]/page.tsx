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
      <div className="flex gap-6">
        {product.image_url && (
          <div className="relative w-48 h-48 flex-shrink-0">
            <Image
              src={product.image_url}
              alt={product.title || "产品图片"}
              fill
              unoptimized
              className="object-contain rounded"
            />
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 text-sm flex-1">
          <div>ASIN: {product.asin || "-"}</div>
          <div>品牌: {product.brand || "-"}</div>
          <div>价格: {product.price ?? "-"}</div>
          <div>类目: {product.category || "-"}</div>
          <div>运费: {product.shipping || "-"}</div>
          <div>评分: {product.review_rating ?? "-"}</div>
          <div>评论数: {product.review_count ?? "-"}</div>
          <div>卖家: {product.third_party_seller || "-"}</div>
          <div>卖家国家: {product.seller_country || "-"}</div>
          <div>
            尺寸: {product.length ?? "-"} x {product.width ?? "-"} x {product.height ?? "-"}
          </div>
          <div>重量: {product.weight ?? "-"}</div>
          <div>发布日期: {product.created_at ? new Date(product.created_at).toLocaleDateString() : "-"}</div>
          <div>ASIN 销量: {product.asin_sales ?? "-"}</div>
          <div>销量趋势(90天): {product.sales_trend_90d ?? "-"}</div>
          <div>价格趋势(90天): {product.price_trend_90d ?? "-"}</div>
          <div>
            平台评分: <ScoreBadge value={product.platform_score ?? 0} />
          </div>
          <div>
            独立站评分: <ScoreBadge value={product.independent_score ?? 0} />
          </div>
        </div>
      </div>
      {product.url && (
        <div>
          <a
            href={product.url}
            target="_blank"
            className="text-blue-600 underline"
          >
            前往产品页面
          </a>
        </div>
      )}
      <AiReview product={product} />
    </div>
  );
}
