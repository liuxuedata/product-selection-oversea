import express from 'express';
import cors from 'cors';
import { products } from './data/products.js';

const app = express();
app.use(cors());

// GET /products?category=&keyword=&page=&limit=
app.get('/products', (req, res) => {
  const { category, keyword, page = 1, limit = 10 } = req.query;
  let filtered = products;

  if (category) {
    filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  if (keyword) {
    const kw = keyword.toLowerCase();
    filtered = filtered.filter(p => p.name.toLowerCase().includes(kw));
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const start = (pageNum - 1) * limitNum;
  const paginated = filtered.slice(start, start + limitNum);

  res.json({
    data: paginated,
    total: filtered.length,
    page: pageNum,
    limit: limitNum
  });
});

// GET /products/:id - product detail
app.get('/products/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const product = products.find(p => p.id === id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  res.json(product);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
