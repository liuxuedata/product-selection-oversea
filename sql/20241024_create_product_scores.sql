-- Create product_scores table to store computed scores per row
create table if not exists product_scores (
  row_id bigint primary key references blackbox_rows(id) on delete cascade,
  platform_score numeric not null default 0,
  independent_score numeric not null default 0,
  created_at timestamptz default now()
);

-- Index to link scores back to their source rows
create index if not exists idx_product_scores_row_id on product_scores(row_id);
