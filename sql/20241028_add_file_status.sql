alter table if exists blackbox_files
  add column if not exists status text,
  add column if not exists processed_at timestamptz;
