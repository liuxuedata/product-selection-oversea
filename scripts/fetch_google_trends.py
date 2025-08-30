# scripts/fetch_google_trends.py
# 依赖: pytrends, psycopg2-binary
import os
import json
from datetime import datetime, timezone

from pytrends.request import TrendReq
import psycopg2

# 环境变量
PG_DSN = os.getenv("PG_DSN") or os.getenv("POSTGRES_URL_NON_POOLING")
GT_COUNTRIES = os.getenv("GT_COUNTRIES", "US,UK,FR,DE").split(",")
GT_WINDOW = os.getenv("GT_WINDOW", "7d")
GT_CATEGORY = os.getenv("GT_CATEGORY", "tech_electronics")

# pytrends 对 trending_searches 的国家代码（名称）
PN_MAP = {
    "US": "united_states",
    "UK": "united_kingdom",
    "FR": "france",
    "DE": "germany",
}

# TikTok/Google 共用的 geo 映射（country_map 表）
REGION_MAP = {
    "US": {"gt": "US", "ttc": "US"},
    "UK": {"gt": "GB", "ttc": "GB"},
    "FR": {"gt": "FR", "ttc": "FR"},
    "DE": {"gt": "DE", "ttc": "DE"},
}

def ensure_dict_tables(cur, country: str):
    # trend_source
    cur.execute("""
      insert into trend_source (source_id, display_name)
      values ('google_trends', 'Google Trends')
      on conflict (source_id) do update set display_name=excluded.display_name
    """)
    # country_map
    region = REGION_MAP.get(country, {"gt": country, "ttc": country})
    cur.execute("""
      insert into country_map (country, gt_geo, ttc_region)
      values (%s, %s, %s)
      on conflict (country) do update set gt_geo=excluded.gt_geo, ttc_region=excluded.ttc_region
    """, (country, region["gt"], region["ttc"]))
    # category
    cur.execute("""
      insert into trend_category_map (category_key)
      values (%s)
      on conflict (category_key) do nothing
    """, (GT_CATEGORY,))

def main():
    assert PG_DSN, "PG_DSN is required"
    # 连接数据库
    conn = psycopg2.connect(PG_DSN, sslmode="require")
    cur = conn.cursor()

    py = TrendReq(hl="en-US", tz=360)
    inserted = 0

    for country in GT_COUNTRIES:
      country = country.strip().upper()
      pn = PN_MAP.get(country)
      if not pn:
          print(f"skip country {country}: not supported by pytrends PN_MAP")
          continue

      # 确保字典表
      ensure_dict_tables(cur, country)

      # 1) 拉取该国当天热门搜索词（24h）
      df = py.trending_searches(pn=pn)  # 单列 DataFrame，index 为序号，第一列为 keyword
      keywords = [str(k).strip() for k in df[0].tolist() if str(k).strip()]

      # 2) 为每个 keyword 取近 GT_WINDOW 的热度，取最后一刻的值
      for kw in keywords:
          try:
              py.build_payload([kw], cat=0, timeframe=f"now {GT_WINDOW}", geo=country, gprop="")
              series = py.interest_over_time()
              if series is None or kw not in series:
                  continue
              score = int(series[kw].iloc[-1]) if len(series.index) else None

              cur.execute("""
                insert into trend_raw
                  (source_id, country, category_key, window_period, keyword, rank, raw_score, meta_json, collected_at)
                values
                  (%s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s)
                on conflict do nothing
              """, (
                "google_trends",
                country,
                GT_CATEGORY,
                GT_WINDOW,
                kw,
                None,                   # Google 没有官方 rank，这里留空
                score,
                json.dumps({"from": "trending_searches"}),
                datetime.now(timezone.utc).isoformat()
              ))
              inserted += 1
          except Exception as e:
              print("keyword error:", kw, e)

    conn.commit()
    cur.close()
    conn.close()
    print("✅ google_trends inserted rows:", inserted)

if __name__ == "__main__":
    main()
