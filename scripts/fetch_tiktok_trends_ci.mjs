// 如果你已有 Playwright 采集，替换这里输出即可：
const MARKETS = (process.env.MARKETS || 'US,UK,FR,DE').split(',');
const WINDOWS = (process.env.WINDOWS || '7d,30d').split(',');
const CATEGORIES = (process.env.CATEGORIES || 'tech_electronics,vehicle_transportation').split(',');

const words = ['iphone 16','usb c hub','robot vacuum','e-bike','dash cam','gaming chair','power station'];

const out = [];
for (const country of MARKETS) {
  for (const category_key of CATEGORIES) {
    for (const window_period of WINDOWS) {
      for (let i=0;i<20;i++) {
        out.push({
          source_id: 'tiktok_trends',
          country, category_key, window_period,
          keyword: words[(i+country.length)%words.length] + ' ' + (i+1),
          rank: i+1,
          raw_score: Math.round(50+Math.random()*50),
          meta_json: { demo: true }
        });
      }
    }
  }
}
console.log(JSON.stringify(out, null, 2));
