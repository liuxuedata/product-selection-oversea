ALTER TABLE blackbox_files DROP COLUMN IF EXISTS status;

-- Ensure PostgREST reloads the schema cache so new columns are recognized
NOTIFY pgrst, 'reload schema';
