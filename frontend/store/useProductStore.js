import { create } from 'zustand';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const useProductStore = create((set, get) => ({
  products: [],
  total: 0,
  page: 1,
  limit: 5,
  category: '',
  keyword: '',
  setCategory: category => set({ category }),
  setKeyword: keyword => set({ keyword }),
  setPage: page => set({ page }),
  fetchProducts: async () => {
    const { page, limit, category, keyword } = get();
    const params = new URLSearchParams({ page, limit });
    if (category) params.append('category', category);
    if (keyword) params.append('keyword', keyword);
    const res = await fetch(`${API_URL}/products?${params.toString()}`);
    const data = await res.json();
    set({ products: data.data, total: data.total });
  }
}));
