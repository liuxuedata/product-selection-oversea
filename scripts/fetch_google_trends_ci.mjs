import googleTrends from 'google-trends-api';

const MARKETS = (process.env.MARKETS || 'US,UK,FR,DE').split(',');
const WINDOWS = (process.env.WINDOWS || '7d,30d').split(','); // 'now 7-d' -> '7d' 简化映射
const CATEGORIES = (process.env.CATEGORIES || 'tech_electronics,vehicle_transportation').split(',');

// 简单映射：window -> Google timeframe
const TIME = { '1d':'now 1-d', '7d':'now 7-d', '30d':'today 1-m' };

function toPayload(country, category_key, window_period, terms) {
  // terms: [{title, formattedTraffic, rank}, ...]
  return terms.slice(0, 50).map((t, i) => ({
    source_id: 'google_trends',
    country,
    category_key,
    window_period,
    keyword: t.title,
    rank: t.rank ?? (i+1),
    raw_score: Number((t.formattedTraffic || '').replace(/[+,]/g,'')) || null,
    meta_json: t
  }));
}

const out = [];
for (const country of MARKETS) {
  for (const category_key of CATEGORIES) {
    for (const window_period of WINDOWS) {
      const tf = TIME[window_period] || TIME['7d'];
      // 这里 demo：按类目给关键字种子，你可以维护更细颗粒的映射
      const seedTerms = category_key === 'vehicle_transportation'
        ? ['e-bike','electric car','scooter']
        : ['iphone','headphones','laptop'];

      const res = await googleTrends.relatedQueries({
        keyword: seedTerms,
        geo: country === 'UK' ? 'GB' : country,
        timeframe: tf
      }).then(JSON.parse).catch(()=>null);

      const terms = res?.default?.rankedList?.[0]?.rankedKeyword || [];
      out.push(...toPayload(country, category_key, window_period, terms));
    }
  }
}
console.log(JSON.stringify(out, null, 2));
