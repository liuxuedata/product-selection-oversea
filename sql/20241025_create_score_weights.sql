create table if not exists score_weights (
  metric text primary key,
  platform_weight numeric not null default 0,
  independent_weight numeric not null default 0,
  updated_at timestamptz default now()
);

insert into score_weights (metric, platform_weight, independent_weight) values
('price', 0.02, 0.08),
('priceTrend', 0.02, 0.05),
('asinSales', 0.11, 0.06),
('salesTrend', 0.09, 0.06),
('parentIncome', 0.07, 0.06),
('asinIncome', 0.07, 0.06),
('review', 0.16, 0.12),
('seller', 0.07, 0.08),
('lastYearSales', 0.07, 0.05),
('yoy', 0.07, 0.05),
('size', 0.03, 0.05),
('weight', 0.03, 0.04),
('storage', 0.03, 0.04),
('age', 0.06, 0.09),
('img', 0.02, 0.03),
('variant', 0.02, 0.02)
on conflict (metric) do nothing;
