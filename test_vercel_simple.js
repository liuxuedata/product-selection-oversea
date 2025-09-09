// 简单的Vercel API测试脚本
const https = require('https');

// 请替换为你的实际Vercel应用URL
const APP_URL = 'https://product-selection-oversea.vercel.app'; // 请替换为你的实际URL

function testAPI(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, APP_URL);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: result
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function runTests() {
  console.log('🚀 开始测试Vercel部署的API...\n');
  console.log(`📱 应用URL: ${APP_URL}\n`);

  try {
    // 测试1: TikTok数据获取
    console.log('1️⃣ 测试TikTok数据获取...');
    const tiktokResult = await testAPI('/api/jobs/fetch-tiktok?country=US&category_key=tech_electronics&window_period=7d');
    console.log(`   状态码: ${tiktokResult.status}`);
    console.log(`   响应: ${JSON.stringify(tiktokResult.data, null, 2)}\n`);

    // 测试2: Google Trends数据获取
    console.log('2️⃣ 测试Google Trends数据获取...');
    const googleResult = await testAPI('/api/jobs/fetch-google', 'POST', {
      country: 'US',
      category_key: 'tech_electronics',
      window_period: '7d'
    });
    console.log(`   状态码: ${googleResult.status}`);
    console.log(`   响应: ${JSON.stringify(googleResult.data, null, 2)}\n`);

    // 测试3: 数据查询
    console.log('3️⃣ 测试数据查询...');
    const searchResult = await testAPI('/api/trends/search?limit=5');
    console.log(`   状态码: ${searchResult.status}`);
    console.log(`   响应: ${JSON.stringify(searchResult.data, null, 2)}\n`);

    console.log('✅ 所有测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
runTests();
