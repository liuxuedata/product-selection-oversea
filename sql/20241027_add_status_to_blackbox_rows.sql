alter table blackbox_rows
  add column if not exists status text default 'processing';
