import ScoreBadge from "./ScoreBadge";

export default function ProductsTable({ data, onRowClick }: { data: any[]; onRowClick: (id: string) => void; }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 sticky top-0">
          <tr>
            <th className="p-2 text-left">封面</th>
            <th className="p-2 text-left">标题</th>
            <th className="p-2">ASIN</th>
            <th className="p-2">父ASIN</th>
            <th className="p-2">价格</th>
            <th className="p-2">价格趋势90d</th>
            <th className="p-2">销量</th>
            <th className="p-2">销量趋势90d</th>
            <th className="p-2">父收入</th>
            <th className="p-2">ASIN收入</th>
            <th className="p-2">评论数</th>
            <th className="p-2">评论评分</th>
            <th className="p-2">卖家数</th>
            <th className="p-2">去年销量</th>
            <th className="p-2">同比%</th>
            <th className="p-2">尺寸</th>
            <th className="p-2">重量kg</th>
            <th className="p-2">仓储1-9</th>
            <th className="p-2">仓储10-12</th>
            <th className="p-2">年龄(月)</th>
            <th className="p-2">图片数</th>
            <th className="p-2">变体数</th>
            <th className="p-2">综合评分</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onRowClick(item.id)}>
              <td className="p-2"><img src={item.image} alt="" className="w-12 h-12 rounded" /></td>
              <td className="p-2 underline whitespace-nowrap" title={item.title}>{item.title}</td>
              <td className="p-2">{item.asin}</td>
              <td className="p-2">{item.parent_asin}</td>
              <td className="p-2">{item.price}</td>
              <td className="p-2">{item.price_trend_90d}%</td>
              <td className="p-2">{item.asin_sales}</td>
              <td className="p-2">{item.sales_trend_90d}%</td>
              <td className="p-2">{item.parent_income}</td>
              <td className="p-2">{item.asin_income}</td>
              <td className="p-2">{item.review_count}</td>
              <td className="p-2">{item.review_rating}</td>
              <td className="p-2">{item.seller_count}</td>
              <td className="p-2">{item.last_year_sales}</td>
              <td className="p-2">{item.yoy}</td>
              <td className="p-2">{item.size}</td>
              <td className="p-2">{item.weight_kg}</td>
              <td className="p-2">{item.storage_fee_jan_sep}</td>
              <td className="p-2">{item.storage_fee_oct_dec}</td>
              <td className="p-2">{item.age_months}</td>
              <td className="p-2">{item.image_count}</td>
              <td className="p-2">{item.variant_count}</td>
              <td className="p-2"><ScoreBadge value={item.score} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
