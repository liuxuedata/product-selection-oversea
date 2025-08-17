# product-selection-oversea

基于跨境站选品示例项目，包含简单的后端和前端。

## Backend

位于 `backend/`，使用 Express 提供 `/products` 接口，支持分页、分类、关键字筛选，并提供 `/products/:id` 详情。

```bash
cd backend
npm install
npm start
```

## Frontend

位于 `frontend/`，使用 Next.js 与 Zustand 实现商品列表和详情页。

```bash
cd frontend
npm install
npm run dev
```

`NEXT_PUBLIC_API_URL` 环境变量可用于自定义后端地址，默认为 `http://localhost:3001`。
