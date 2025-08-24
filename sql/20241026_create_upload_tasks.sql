create table if not exists upload_tasks (
  id uuid primary key default gen_random_uuid(),
  file_id uuid references blackbox_files(id) on delete cascade,
  rows jsonb not null,
  sheet_name text,
  columns jsonb,
  status text not null default 'pending',
  result jsonb,
  error text,
  created_at timestamptz default now(),
  started_at timestamptz,
  finished_at timestamptz
);

create index if not exists idx_upload_tasks_status on upload_tasks(status);
