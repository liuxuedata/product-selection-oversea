// 测试TikTok Trends API的简单脚本
const http = require('http');

// 测试本地API
function testLocalAPI() {
  console.log('🧪 测试本地TikTok API...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/jobs/fetch-tiktok?country=US&category_key=tech_electronics&window_period=7d',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`📊 状态码: ${res.statusCode}`);
    console.log(`📋 响应头:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        console.log('✅ API响应:', JSON.stringify(result, null, 2));
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

// 测试Google Trends API
function testGoogleAPI() {
  console.log('\n🧪 测试Google Trends API...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/jobs/fetch-google',
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

  const req = http.request(options, (res) => {
    console.log(`📊 状态码: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        console.log('✅ Google API响应:', JSON.stringify(result, null, 2));
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

// 测试数据库连接
function testDatabaseConnection() {
  console.log('\n🧪 测试数据库连接...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/trends/search?limit=5',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`📊 状态码: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        console.log('✅ 数据库连接测试:', JSON.stringify(result, null, 2));
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

// 运行所有测试
console.log('🚀 开始测试Trends API...\n');

// 等待服务器启动
setTimeout(() => {
  testLocalAPI();
  setTimeout(testGoogleAPI, 2000);
  setTimeout(testDatabaseConnection, 4000);
}, 5000);
