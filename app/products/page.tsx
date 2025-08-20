"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProductsTable from "@/components/ProductsTable";

type Product = any;

export default function ProductsPage() {
  const [data, setData] = useState<Product[]>([]);
  const [q, setQ] = useState("");
  const [scoreMin, setScoreMin] = useState<number | "">("");
  const [scoreMax, setScoreMax] = useState<number | "">("");
  const [sort, setSort] = useState<string>("score");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const router = useRouter();

  useEffect(() => {
    fetch("/api/mock/products.json").then(r => r.json()).then((res) => setData(res.items));
  }, []);

  const filtered = data
    .filter((item) =>
      [item.title, item.asin, item.url].some((f) => f.toLowerCase().includes(q.toLowerCase()))
    )
    .filter((item) => (scoreMin === "" || item.score >= scoreMin) && (scoreMax === "" || item.score <= scoreMax));

  const sorted = [...filtered].sort((a, b) => {
    const dir = order === "asc" ? 1 : -1;
    return a[sort] > b[sort] ? dir : -dir;
  });

  const totalPages = Math.ceil(sorted.length / pageSize);
  const start = (page - 1) * pageSize;
  const displayed = sorted.slice(start, start + pageSize);

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap gap-2 items-center bg-white p-4 rounded shadow">
        <input value={q} onChange={e => {setQ(e.target.value); setPage(1);}} placeholder="搜索" className="border px-2 py-1 rounded" />
        <div className="flex items-center gap-1">
          <label>Score≥</label>
          <input type="number" value={scoreMin} onChange={e=>{setScoreMin(e.target.value?Number(e.target.value):""); setPage(1);}} className="border w-20 px-2 py-1 rounded" />
        </div>
        <div className="flex items-center gap-1">
          <label>Score≤</label>
          <input type="number" value={scoreMax} onChange={e=>{setScoreMax(e.target.value?Number(e.target.value):""); setPage(1);}} className="border w-20 px-2 py-1 rounded" />
        </div>
        <div className="flex items-center gap-1">
          <label>排序</label>
          <select value={sort} onChange={e=>setSort(e.target.value)} className="border px-2 py-1 rounded">
            <option value="score">综合评分</option>
            <option value="price">价格</option>
            <option value="asin_sales">销量</option>
          </select>
          <select value={order} onChange={e=>setOrder(e.target.value as any)} className="border px-2 py-1 rounded">
            <option value="desc">降序</option>
            <option value="asc">升序</option>
          </select>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <label>每页</label>
          <select value={pageSize} onChange={e=>{setPageSize(Number(e.target.value)); setPage(1);}} className="border px-2 py-1 rounded">
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      <ProductsTable data={displayed} onRowClick={(id)=>router.push(`/products/${id}`)} />

      <div className="flex justify-between items-center">
        <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="px-3 py-1 border rounded disabled:opacity-50">上一页</button>
        <span>{page} / {totalPages || 1}</span>
        <button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} className="px-3 py-1 border rounded disabled:opacity-50">下一页</button>
      </div>
    </div>
  );
}
