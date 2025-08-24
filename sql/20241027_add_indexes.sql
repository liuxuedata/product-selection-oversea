CREATE INDEX IF NOT EXISTS idx_blackbox_rows_imported_at
  ON blackbox_rows (imported_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_scores_platform_score_row_id
  ON product_scores (platform_score DESC, row_id);
