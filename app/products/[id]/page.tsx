"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ScoreBadge from "@/components/ScoreBadge";

export default function ProductDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [product, setProduct] = useState<any | null>(null);
  const [related, setRelated] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/mock/products.json").then(r=>r.json()).then(({items}) => {
      const p = items.find((i: any) => i.id === id);
      setProduct(p);
      setRelated(items.slice(0, 4));
    });
  }, [id]);

  if (!product) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="bg-white p-4 rounded shadow flex gap-4">
        <img src={product.image} alt="" className="w-32 h-32 rounded" />
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">{product.title}</h1>
          <a href={product.url} className="text-blue-600 underline" target="_blank" rel="noreferrer">{product.url}</a>
          <div><ScoreBadge value={product.score} /></div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>价格: {product.price}</div>
            <div>销量: {product.asin_sales}</div>
            <div>评论: {product.review_count}</div>
            <div>卖家数: {product.seller_count}</div>
            <div>年龄(月): {product.age_months}</div>
            <div>尺寸: {product.size}</div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-medium mb-2">评分分解</h2>
        <div className="h-40 bg-gray-100 flex items-center justify-center text-gray-500">TODO: Score Breakdown Chart</div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-medium mb-2">趋势</h2>
        <div className="h-40 bg-gray-100 flex items-center justify-center text-gray-500">TODO: Trend Chart</div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-medium mb-2">相关产品</h2>
        <ul className="list-disc pl-6 text-sm">
          {related.map(r => (
            <li key={r.id}>{r.title}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
