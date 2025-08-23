DROP VIEW IF EXISTS v_blackbox_rows_with_scores;

ALTER TABLE blackbox_rows
  ADD COLUMN imported_at timestamptz NOT NULL DEFAULT date_trunc('minute', now());

CREATE VIEW v_blackbox_rows_with_scores AS
SELECT
  r.id AS row_id,
  r.file_id,
  r.row_index,
  r.asin,
  r.url,
  r.title,
  r.image_url,
  r.brand,
  r.shipping,
  r.category,
  r.bsr,
  r.upc,
  r.gtin,
  r.ean,
  r.isbn,
  r.sub_category,
  r.sub_category_bsr,
  r.price,
  r.price_trend_90d,
  r.parent_sales,
  r.asin_sales,
  r.sales_trend_90d,
  r.parent_revenue,
  r.asin_revenue,
  r.review_count,
  r.review_rating,
  r.third_party_seller,
  r.seller_country,
  r.active_seller_count,
  r.last_year_sales,
  r.yoy_sales_percent,
  r.size_tier,
  r.length,
  r.width,
  r.height,
  r.weight,
  r.storage_fee_jan_sep,
  r.storage_fee_oct_dec,
  r.best_sales_period,
  r.age_months,
  r.image_count,
  r.variant_count,
  r.sales_review_ratio,
  r.data,
  r.imported_at,
  s.platform_score,
  s.independent_score,
  s.scored_at
FROM blackbox_rows r
LEFT JOIN product_scores s ON s.row_id = r.id;

-- Ensure PostgREST reloads the schema cache so new columns are recognized
NOTIFY pgrst, 'reload schema';
