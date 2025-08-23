ALTER TABLE blackbox_files
  ADD COLUMN IF NOT EXISTS inserted_count int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS skipped_count int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS invalid_count int DEFAULT 0;

-- Ensure PostgREST reloads the schema cache so new columns are recognized
NOTIFY pgrst, 'reload schema';
