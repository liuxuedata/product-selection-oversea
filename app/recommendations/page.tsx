"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ScoreBadge from "@/components/ScoreBadge";

type Product = any;

export default function RecommendationsPage() {
  const [data, setData] = useState<Product[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/mock/recommendations.json").then(r=>r.json()).then(res=>setData(res.items));
  }, []);

  return (
    <div className="p-6 space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="p-2 text-left">标题</th>
              <th className="p-2">综合评分</th>
              <th className="p-2">推荐等级</th>
              <th className="p-2 text-left">推荐理由</th>
            </tr>
          </thead>
          <tbody>
            {data.map(item => {
              const label = item.score >= 85 ? "强烈推荐" : item.score >= 70 ? "推荐" : "观察";
              return (
                <tr key={item.id} className="hover:bg-gray-50 cursor-pointer" onClick={()=>router.push(`/products/${item.id}`)}>
                  <td className="p-2 underline whitespace-nowrap" title={item.title}>{item.title}</td>
                  <td className="p-2"><ScoreBadge value={item.score} /></td>
                  <td className="p-2">{label}</td>
                  <td className="p-2 text-xs text-gray-600">占位推荐理由</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
