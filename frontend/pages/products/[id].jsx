import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState(null);

  useEffect(() => {
    if (id) {
      fetch(`${API_URL}/products/${id}`).then(res => res.json()).then(setProduct);
    }
  }, [id]);

  if (!product) return <div>Loading...</div>;

  return (
    <div>
      <h1>{product.name}</h1>
      <img src={product.image} alt={product.name} width="200" />
      <p>Price: ${product.price}</p>
      <p>Sales: {product.sales}</p>
      <p>Source: {product.source}</p>
      <p>{product.description}</p>
    </div>
  );
}
