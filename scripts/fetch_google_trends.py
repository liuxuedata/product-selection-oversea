from pytrends.request import TrendReq
import psycopg2
import os
import json
from datetime import datetime

def main():
    pytrends = TrendReq(hl='en-US', tz=360)
    kw_list = ["iphone 16", "e-bike", "robot vacuum"]  # 关键字池
    pytrends.build_payload(kw_list, cat=0, timeframe='now 7-d', geo='US', gprop='')

    data = pytrends.interest_over_time()
    rows = []
    for kw in kw_list:
        if kw in data:
            score = int(data[kw].iloc[-1])  # 最近一天的热度
            rows.append({
                "source_id": "google_trends",
                "country": "US",
                "category_key": "tech_electronics",
                "window_period": "7d",
                "keyword": kw,
                "rank": None,
                "raw_score": score,
                "meta_json": json.dumps({}),
                "collected_at": datetime.utcnow().isoformat()
            })

    dsn = os.getenv("PG_DSN") or os.getenv("POSTGRES_URL_NON_POOLING")
    conn = psycopg2.connect(dsn, sslmode="require")
    cur = conn.cursor()

    for r in rows:
        cur.execute("""
            insert into trend_raw
            (source_id, country, category_key, window_period, keyword, rank, raw_score, meta_json, collected_at)
            values (%s,%s,%s,%s,%s,%s,%s,%s,%s)
            on conflict do nothing
        """, (r["source_id"], r["country"], r["category_key"], r["window_period"], r["keyword"],
              r["rank"], r["raw_score"], r["meta_json"], r["collected_at"]))

    conn.commit()
    cur.close()
    conn.close()
    print("✅ Google Trends inserted:", len(rows))

if __name__ == "__main__":
    main()
