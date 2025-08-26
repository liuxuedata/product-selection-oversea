# Requirements: pip install pytrends psycopg2-binary
# ENV: PG_DSN (e.g. postgres://user:pass@host:5432/dbname)

from pytrends.request import TrendReq
import psycopg2, json, os, sys, time

WINDOW_MAP = {'now 1-d':'1d','now 7-d':'7d','today 1-m':'30d'}

def upsert_raw(cur, rows):
    if not rows: return
    sql = """
    insert into trend_raw
      (source_id, country, category_key, window_period, keyword, rank, raw_score, meta_json, collected_at)
    values
      (%(source_id)s,%(country)s,%(category_key)s,%(window)s,%(keyword)s,%(rank)s,%(raw_score)s,%(meta_json)s, now())
    on conflict do nothing;
    """
    cur.executemany(sql, rows)

def main():
    dsn = os.environ.get("PG_DSN")
    if not dsn:
        print("Missing PG_DSN env.", file=sys.stderr); sys.exit(1)

    PT = TrendReq(hl='en-US', tz=0)
    windows = ['now 1-d','now 7-d','today 1-m']
    countries = [('US','US'),('UK','GB'),('FR','FR'),('DE','DE')]

    conn = psycopg2.connect(dsn)
    cur = conn.cursor()

    for country, geo in countries:
        for w in windows:
            try:
                # 18 = Shopping
                PT.build_payload(kw_list=[' '], cat=18, geo=geo, timeframe=w)
                rq = PT.related_queries().get(' ', {})
                rising = (rq or {}).get('rising')
            except Exception as e:
                print(f"[warn] {country} {w} fetch error: {e}", file=sys.stderr)
                time.sleep(2)
                continue

            rows = []
            if rising is not None and not rising.empty:
                df = rising.reset_index()
                for i, row in df.iterrows():
                    rows.append({
                      'source_id':'google_trends',
                      'country': country,
                      'category_key':'shopping',
                      'window': WINDOW_MAP[w],
                      'keyword': row['query'],
                      'rank': int(i)+1,
                      'raw_score': float(row.get('value', 0)) if row.get('value', None) is not None else None,
                      'meta_json': json.dumps({'type':'rising','timeframe':w})
                    })
            if rows:
                upsert_raw(cur, rows)
                conn.commit()
                print(f"[ok] google_trends {country} {w}: {len(rows)} rows")

    cur.close(); conn.close()

if __name__ == '__main__':
    main()
