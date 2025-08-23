create table if not exists product_scores (
  id uuid primary key default gen_random_uuid(),
  row_id uuid not null references blackbox_rows(id) on delete cascade,
  platform_score numeric,
  independent_score numeric,
  meta jsonb,
  scored_at timestamptz default now()
);

create index if not exists idx_product_scores_row on product_scores(row_id);
