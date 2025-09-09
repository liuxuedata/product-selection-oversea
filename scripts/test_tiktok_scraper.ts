#!/usr/bin/env ts-node

/**
 * TikTok 爬虫测试脚本
 * 用于验证爬虫功能是否正常工作
 */

import { chromium, Browser, Page } from 'playwright';

async function testTikTokAccess() {
  console.log('🧪 开始测试 TikTok Creative Center 访问...');
  
  let browser: Browser | null = null;
  
  try {
    // 启动浏览器
    browser = await chromium.launch({
      headless: false, // 显示浏览器窗口以便观察
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    // 测试1: 访问 TikTok Creative Center 主页
    console.log('📱 测试1: 访问 TikTok Creative Center...');
    try {
      await page.goto('https://ads.tiktok.com/creative_radar_api/', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      const title = await page.title();
      console.log(`✅ 页面标题: ${title}`);
      
      // 检查是否有登录要求
      const loginRequired = await page.$('text=Sign in') || await page.$('text=Login') || await page.$('[data-testid*="login"]');
      if (loginRequired) {
        console.log('⚠️ 检测到登录要求，可能需要登录态');
      } else {
        console.log('✅ 无需登录即可访问');
      }
      
    } catch (error) {
      console.log('❌ 访问失败:', error);
    }

    // 测试2: 尝试访问 API 端点
    console.log('🔗 测试2: 尝试访问 API 端点...');
    try {
      const apiUrl = 'https://ads.tiktok.com/creative_radar_api/v1/popular_trend/hashtag/list?region=US&period=7&category=Technology&limit=10';
      
      const response = await page.request.get(apiUrl, {
        headers: {
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://ads.tiktok.com/creative_radar_api/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      console.log(`📊 API 响应状态: ${response.status()}`);
      
      if (response.ok()) {
        const data = await response.json();
        console.log('✅ API 响应成功:', JSON.stringify(data, null, 2));
      } else {
        const text = await response.text();
        console.log('❌ API 响应失败:', text);
      }
      
    } catch (error) {
      console.log('❌ API 请求失败:', error);
    }

    // 测试3: 检查页面元素
    console.log('🔍 测试3: 检查页面元素...');
    try {
      // 等待页面加载
      await page.waitForTimeout(3000);
      
      // 查找可能的趋势数据元素
      const trendElements = await page.$$('[data-testid*="trend"], .trend-item, .hashtag-item, [class*="trend"], [class*="hashtag"]');
      console.log(`📈 找到 ${trendElements.length} 个可能的趋势元素`);
      
      if (trendElements.length > 0) {
        for (let i = 0; i < Math.min(3, trendElements.length); i++) {
          const text = await trendElements[i].textContent();
          console.log(`  - 元素 ${i + 1}: ${text?.trim()}`);
        }
      }
      
    } catch (error) {
      console.log('❌ 元素检查失败:', error);
    }

    // 测试4: 检查网络请求
    console.log('🌐 测试4: 监听网络请求...');
    const requests: string[] = [];
    
    page.on('request', (request) => {
      if (request.url().includes('creative_radar') || request.url().includes('trend')) {
        requests.push(request.url());
      }
    });

    // 刷新页面以捕获请求
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    
    console.log(`📡 捕获到 ${requests.length} 个相关请求:`);
    requests.forEach((url, index) => {
      console.log(`  ${index + 1}. ${url}`);
    });

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  } finally {
    if (browser) {
      await browser.close();
      console.log('🧹 浏览器已关闭');
    }
  }
}

// 测试网络连接
async function testNetworkConnectivity() {
  console.log('🌐 测试网络连接...');
  
  const testUrls = [
    'https://ads.tiktok.com',
    'https://ads.tiktok.com/creative_radar_api/',
    'https://www.tiktok.com'
  ];
  
  for (const url of testUrls) {
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        timeout: 10000 
      });
      console.log(`✅ ${url} - 状态: ${response.status}`);
    } catch (error) {
      console.log(`❌ ${url} - 错误: ${error}`);
    }
  }
}

// 主函数
async function main() {
  console.log('🚀 开始 TikTok 爬虫测试...\n');
  
  // 测试网络连接
  await testNetworkConnectivity();
  console.log('');
  
  // 测试浏览器访问
  await testTikTokAccess();
  
  console.log('\n🎉 测试完成！');
  console.log('\n📝 测试总结:');
  console.log('1. 如果网络连接失败，请检查网络设置');
  console.log('2. 如果页面访问失败，可能是地区限制或需要代理');
  console.log('3. 如果API请求失败，可能需要登录态或API密钥');
  console.log('4. 如果元素检查失败，页面结构可能已改变');
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

export { testTikTokAccess, testNetworkConnectivity };
