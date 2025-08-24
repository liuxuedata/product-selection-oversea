-- Add status and processed_at tracking to uploaded files
ALTER TABLE blackbox_files
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS processed_at timestamptz;

-- Track import time on product scores for faster lookups
ALTER TABLE product_scores
  ADD COLUMN IF NOT EXISTS imported_at timestamptz;

-- Index recent imports for quick ordering
CREATE INDEX IF NOT EXISTS idx_blackbox_rows_imported_at ON blackbox_rows(imported_at DESC);

-- Speed up high score queries
CREATE INDEX IF NOT EXISTS idx_product_scores_platform_imported_at ON product_scores(platform_score DESC, imported_at DESC);
