import Link from 'next/link';
import { useEffect } from 'react';
import { useProductStore } from '../../store/useProductStore';

export default function ProductList() {
  const {
    products,
    total,
    page,
    limit,
    category,
    keyword,
    setCategory,
    setKeyword,
    setPage,
    fetchProducts
  } = useProductStore();

  useEffect(() => {
    fetchProducts();
  }, [page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1>Products</h1>
      <div style={{ marginBottom: '1rem' }}>
        <input
          placeholder="Category"
          value={category}
          onChange={e => setCategory(e.target.value)}
        />
        <input
          placeholder="Keyword"
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
        />
        <button onClick={() => { setPage(1); fetchProducts(); }}>Search</button>
      </div>
      <ul>
        {products.map(p => (
          <li key={p.id}>
            <Link href={`/products/${p.id}`}>{p.name} - ${p.price}</Link>
          </li>
        ))}
      </ul>
      <div style={{ marginTop: '1rem' }}>
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
        <span style={{ margin: '0 1rem' }}>{page} / {totalPages || 1}</span>
        <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}
