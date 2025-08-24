create table if not exists recommendation_rows (
  row_id uuid primary key references blackbox_rows(id) on delete cascade,
  file_id uuid not null references blackbox_files(id) on delete cascade,
  imported_at timestamptz not null,
  platform_score numeric,
  independent_score numeric
);

create index if not exists idx_recommendation_rows_file on recommendation_rows(file_id, imported_at desc);
