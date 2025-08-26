-- Normalize scores for current_date and merge into trend_keyword_daily + update keyword_pool

create or replace view v_trend_norm as
with base as (
  select source_id, country, category_key, window_period, keyword, raw_score, collected_at::date as d
  from trend_raw where collected_at::date = current_date
),
stats as (
  select source_id, country, category_key, window_period, d,
         min(raw_score) smin, max(raw_score) smax
  from base group by 1,2,3,4,5
)
select b.*,
  case when s.smax = s.smin or b.raw_score is null then null
       else round((b.raw_score - s.smin) * 100.0 / nullif(s.smax - s.smin,0), 2)
  end as norm
from base b join stats s using (source_id,country,category_key,window_period,d);

insert into trend_keyword_daily
  (keyword, country, category_key, window_period, g_score, t_score, trend_score,
   g_rank, t_rank, sources, collected_date)
select
  kw, country, category_key, window_period,
  max(case when source_id='google_trends' then norm end) as g_score,
  max(case when source_id='tiktok_trends'  then norm end) as t_score,
  null,
  min(case when source_id='google_trends' then rnk end),
  min(case when source_id='tiktok_trends'  then rnk end),
  jsonb_agg(distinct source_id),
  current_date
from (
  select source_id, country, category_key, window_period, keyword kw, norm,
         row_number() over (partition by source_id,country,category_key,window_period order by norm desc) rnk
  from v_trend_norm
) t
group by kw, country, category_key, window_period
on conflict (keyword, country, category_key, window_period, collected_date) do update
set g_score=excluded.g_score, t_score=excluded.t_score,
    g_rank=excluded.g_rank, t_rank=excluded.t_rank, sources=excluded.sources;

update trend_keyword_daily
set trend_score = round(0.6*coalesce(g_score,0)+0.4*coalesce(t_score,0),2)
where collected_date = current_date;

insert into keyword_pool (keyword, country, category_key, first_seen, last_seen, last_score, hit_days)
select keyword, country, category_key, collected_date, collected_date, trend_score, 1
from trend_keyword_daily where collected_date = current_date
on conflict (keyword, coalesce(country,''), coalesce(category_key,'')) do update
set last_seen = excluded.last_seen,
    last_score = excluded.last_score,
    hit_days = keyword_pool.hit_days + 1;
