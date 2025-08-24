"use client";
import { useState } from "react";

export default function GoogleTrendPage() {
  const [form, setForm] = useState({
    country: "",
    time: "",
    category: "",
    keyword: "",
  });
  const [data, setData] = useState<{ term: string; value: number }[]>([]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(form);
    const res = await fetch(`/api/trends/google?${params.toString()}`);
    const json = await res.json();
    setData(json.results || []);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-end">
        <input
          name="keyword"
          value={form.keyword}
          onChange={handleChange}
          placeholder="关键词"
          className="border p-1"
        />
        <input
          name="country"
          value={form.country}
          onChange={handleChange}
          placeholder="国家"
          className="border p-1"
        />
        <input
          name="time"
          value={form.time}
          onChange={handleChange}
          placeholder="时间周期"
          className="border p-1"
        />
        <input
          name="category"
          value={form.category}
          onChange={handleChange}
          placeholder="类目"
          className="border p-1"
        />
        <button type="submit" className="px-2 py-1 border">
          查询
        </button>
      </form>
      <ul className="list-disc pl-4">
        {data.map((d, i) => (
          <li key={i}>
            {d.term}: {d.value}
          </li>
        ))}
      </ul>
    </div>
  );
}
