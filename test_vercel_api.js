// 测试Vercel部署的API
const https = require('https');

// 测试Vercel TikTok API
function testVercelTikTokAPI() {
  console.log('🧪 测试Vercel TikTok API...');
  
  // 请替换为你的实际Vercel应用URL
  const appUrl = 'https://your-app-name.vercel.app';
  const path = '/api/jobs/fetch-tiktok?country=US&category_key=tech_electronics&window_period=7d';
  
  const options = {
    hostname: appUrl.replace('https://', ''),
    port: 443,
    path: path,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = https.request(options, (res) => {
    console.log(`📊 状态码: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        console.log('✅ Vercel TikTok API响应:', JSON.stringify(result, null, 2));
      } catch (e) {
        console.log('📄 原始响应:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ 请求失败:', e.message);
  });

  req.end();
}

// 测试Vercel Google Trends API
function testVercelGoogleAPI() {
  console.log('\n🧪 测试Vercel Google Trends API...');
  
  const appUrl = 'https://your-app-name.vercel.app';
  const path = '/api/jobs/fetch-google';
  
  const options = {
    hostname: appUrl.replace('https://', ''),
    port: 443,
    path: path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const postData = JSON.stringify({
    country: 'US',
    category_key: 'tech_electronics',
    window_period: '7d'
  });

  const req = https.request(options, (res) => {
    console.log(`📊 状态码: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        console.log('✅ Vercel Google API响应:', JSON.stringify(result, null, 2));
      } catch (e) {
        console.log('📄 原始响应:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ 请求失败:', e.message);
  });

  req.write(postData);
  req.end();
}

// 测试Vercel数据查询API
function testVercelSearchAPI() {
  console.log('\n🧪 测试Vercel数据查询API...');
  
  const appUrl = 'https://your-app-name.vercel.app';
  const path = '/api/trends/search?limit=5';
  
  const options = {
    hostname: appUrl.replace('https://', ''),
    port: 443,
    path: path,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = https.request(options, (res) => {
    console.log(`📊 状态码: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        console.log('✅ Vercel搜索API响应:', JSON.stringify(result, null, 2));
      } catch (e) {
        console.log('📄 原始响应:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ 请求失败:', e.message);
  });

  req.end();
}

// 运行测试
console.log('🚀 开始测试Vercel部署的API...\n');
console.log('⚠️ 请先更新脚本中的appUrl为你的实际Vercel应用URL\n');

// 取消注释下面的行来运行测试
// testVercelTikTokAPI();
// setTimeout(testVercelGoogleAPI, 2000);
// setTimeout(testVercelSearchAPI, 4000);

console.log('📝 使用说明:');
console.log('1. 将脚本中的 "https://your-app-name.vercel.app" 替换为你的实际Vercel应用URL');
console.log('2. 取消注释测试函数调用');
console.log('3. 运行: node test_vercel_api.js');
