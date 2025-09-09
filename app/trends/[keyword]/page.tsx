"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

type TrendDetail = {
  source_id: string;
  country: string;
  category_key: string;
  window_period: string;
  keyword: string;
  rank: number | null;
  raw_score: number | null;
  collected_at: string;
  meta_json: any;
};

type ApiResp = {
  ok: boolean;
  total: number;
  rows: TrendDetail[];
};

export default function TrendKeywordDetail() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  // 所有Hooks必须在顶层调用
  const [data, setData] = useState<TrendDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 检查参数有效性
  const keyword = params?.keyword ? decodeURIComponent(params.keyword as string) : null;

  useEffect(() => {
    // 只有在keyword有效时才执行
    if (!keyword) {
      setError('无效的关键词参数');
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        const queryParams = new URLSearchParams();
        queryParams.set('keyword', keyword!); // 使用非空断言，因为前面已经检查过
        queryParams.set('limit', '100');
        
        // 添加筛选参数
        const source_id = searchParams?.get('source_id');
        const country = searchParams?.get('country');
        const category_key = searchParams?.get('category_key');
        const window_period = searchParams?.get('window_period');
        
        if (source_id && source_id !== 'all') queryParams.set('source_id', source_id);
        if (country) queryParams.set('country', country);
        if (category_key) queryParams.set('category_key', category_key);
        if (window_period) queryParams.set('window_period', window_period);

        const res = await fetch(`/api/trends/search?${queryParams.toString()}`);
        const result: ApiResp = await res.json();
        
        if (result.ok) {
          setData(result.rows);
        } else {
          setError('数据加载失败');
        }
      } catch (e: any) {
        setError(e.message || '网络错误');
      } finally {
        setLoading(false);
      }
    }

    if (keyword) {
      fetchData();
    }
  }, [keyword, searchParams]);

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-gray-500';
    if (score >= 85) return 'text-green-600 font-semibold';
    if (score >= 70) return 'text-blue-600';
    if (score >= 55) return 'text-yellow-600';
    return 'text-gray-500';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600 mb-4">❌ {error}</div>
        <Link href="/trends" className="text-blue-600 hover:underline">
          ← 返回趋势列表
        </Link>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-6">
        <div className="text-gray-500 mb-4">未找到关键词 &quot;{keyword}&quot; 的相关数据</div>
        <Link href="/trends" className="text-blue-600 hover:underline">
          ← 返回趋势列表
        </Link>
      </div>
    );
  }

  // 按时间排序，最新的在前
  const sortedData = [...data].sort((a, b) => 
    new Date(b.collected_at).getTime() - new Date(a.collected_at).getTime()
  );

         const latestData = sortedData[0];
         const avgScore = data.reduce((sum, item) => sum + (Number(item.raw_score) || 0), 0) / data.length;
         const maxScore = Math.max(...data.map(item => Number(item.raw_score) || 0));
         const minScore = Math.min(...data.map(item => Number(item.raw_score) || 0));
         
         // 获取详细数据
         const metaData = latestData.meta_json || {};
         const viewsCount = metaData.views_count || 0;
         const postsCount = metaData.posts_count || 0;
         const engagementRate = metaData.engagement_rate || '0.000';
         const topRegions = metaData.top_regions || [];
         const relatedInterests = metaData.related_interests || [];
         const audienceInsights = metaData.audience_insights || {};
         const trendDirection = metaData.trend_direction || 'stable';

  return (
    <div className="p-6 space-y-6">
      {/* 头部信息 */}
      <div className="flex items-center gap-4">
        <Link href="/trends" className="text-blue-600 hover:underline">
          ← 返回趋势列表
        </Link>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <h1 className="text-2xl font-bold mb-2">{keyword}</h1>
        <div className="text-gray-600 mb-4">
          共找到 {data.length} 条相关数据
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded">
            <div className="text-sm text-gray-600">最新得分</div>
            <div className={`text-2xl font-bold ${getScoreColor(Number(latestData.raw_score))}`}>
              {latestData.raw_score ? Number(latestData.raw_score).toFixed(1) : 'N/A'}
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded">
            <div className="text-sm text-gray-600">平均得分</div>
            <div className={`text-2xl font-bold ${getScoreColor(avgScore)}`}>
              {avgScore.toFixed(1)}
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded">
            <div className="text-sm text-gray-600">最高得分</div>
            <div className={`text-2xl font-bold ${getScoreColor(maxScore)}`}>
              {maxScore.toFixed(1)}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <div className="text-sm text-gray-600">最低得分</div>
            <div className={`text-2xl font-bold ${getScoreColor(minScore)}`}>
              {minScore.toFixed(1)}
            </div>
          </div>
        </div>

        {/* 趋势数据 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-purple-50 p-4 rounded">
            <div className="text-sm text-gray-600">播放量</div>
            <div className="text-2xl font-bold text-purple-600">
              {viewsCount > 1000000 ? `${(viewsCount / 1000000).toFixed(1)}M` : 
               viewsCount > 1000 ? `${(viewsCount / 1000).toFixed(1)}K` : viewsCount}
            </div>
          </div>
          <div className="bg-indigo-50 p-4 rounded">
            <div className="text-sm text-gray-600">帖子数</div>
            <div className="text-2xl font-bold text-indigo-600">
              {postsCount > 1000 ? `${(postsCount / 1000).toFixed(1)}K` : postsCount}
            </div>
          </div>
          <div className="bg-pink-50 p-4 rounded">
            <div className="text-sm text-gray-600">互动率</div>
            <div className="text-2xl font-bold text-pink-600">
              {(parseFloat(engagementRate) * 100).toFixed(1)}%
            </div>
          </div>
          <div className={`p-4 rounded ${
            trendDirection === 'up' ? 'bg-green-50' : 
            trendDirection === 'down' ? 'bg-red-50' : 'bg-gray-50'
          }`}>
            <div className="text-sm text-gray-600">趋势方向</div>
            <div className={`text-2xl font-bold ${
              trendDirection === 'up' ? 'text-green-600' : 
              trendDirection === 'down' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {trendDirection === 'up' ? '↗️ 上升' : 
               trendDirection === 'down' ? '↘️ 下降' : '→ 稳定'}
            </div>
          </div>
        </div>

        {/* 最新数据详情 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">最新数据详情</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">来源:</span>
              <span className="ml-2 font-medium">{latestData.source_id}</span>
            </div>
            <div>
              <span className="text-gray-600">国家:</span>
              <span className="ml-2 font-medium">{latestData.country}</span>
            </div>
            <div>
              <span className="text-gray-600">类目:</span>
              <span className="ml-2 font-medium">{latestData.category_key}</span>
            </div>
            <div>
              <span className="text-gray-600">窗口:</span>
              <span className="ml-2 font-medium">{latestData.window_period}</span>
            </div>
            <div>
              <span className="text-gray-600">排名:</span>
              <span className="ml-2 font-medium">{latestData.rank || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600">采集时间:</span>
              <span className="ml-2 font-medium">{formatDateTime(latestData.collected_at)}</span>
            </div>
          </div>
        </div>

        {/* Top Regions */}
        {topRegions.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">热门地区</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topRegions.map((region: any, index: number) => (
                <div key={index} className="bg-white border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{region.region}</div>
                      <div className="text-sm text-gray-500">热度指数</div>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{region.score}</div>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(region.score / 500) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Interests */}
        {relatedInterests.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">相关兴趣</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatedInterests.map((interest: any, index: number) => (
                <div key={index} className="bg-white border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{interest.interest}</div>
                      <div className="text-sm text-gray-500">相关度</div>
                    </div>
                    <div className="text-2xl font-bold text-green-600">{interest.score}</div>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${(interest.score / 300) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audience Insights */}
        {audienceInsights.age_distribution && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">受众洞察</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 年龄分布 */}
              <div className="bg-white border rounded-lg p-4">
                <h4 className="font-medium mb-3">年龄分布</h4>
                {audienceInsights.age_distribution.map((age: any, index: number) => (
                  <div key={index} className="flex justify-between items-center mb-2">
                    <span className="text-sm">{age.age_range}</span>
                    <span className="font-medium">{age.percentage}%</span>
                  </div>
                ))}
              </div>
              
              {/* 性别分布 */}
              <div className="bg-white border rounded-lg p-4">
                <h4 className="font-medium mb-3">性别分布</h4>
                {audienceInsights.gender_distribution.map((gender: any, index: number) => (
                  <div key={index} className="flex justify-between items-center mb-2">
                    <span className="text-sm">{gender.gender}</span>
                    <span className="font-medium">{gender.percentage}%</span>
                  </div>
                ))}
              </div>
              
              {/* 热门城市 */}
              <div className="bg-white border rounded-lg p-4">
                <h4 className="font-medium mb-3">热门城市</h4>
                {audienceInsights.top_cities?.slice(0, 3).map((city: any, index: number) => (
                  <div key={index} className="flex justify-between items-center mb-2">
                    <span className="text-sm">{city.city}</span>
                    <span className="font-medium">{city.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 历史数据表格 */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">历史数据</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">来源</th>
                <th className="px-4 py-3 text-left">国家</th>
                <th className="px-4 py-3 text-left">类目</th>
                <th className="px-4 py-3 text-left">窗口</th>
                <th className="px-4 py-3 text-left">排名</th>
                <th className="px-4 py-3 text-left">得分</th>
                <th className="px-4 py-3 text-left">采集时间</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((item, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{item.source_id}</td>
                  <td className="px-4 py-3">{item.country}</td>
                  <td className="px-4 py-3">{item.category_key}</td>
                  <td className="px-4 py-3">{item.window_period}</td>
                  <td className="px-4 py-3">{item.rank || 'N/A'}</td>
                  <td className={`px-4 py-3 font-medium ${getScoreColor(item.raw_score)}`}>
                    {item.raw_score ? Number(item.raw_score).toFixed(1) : 'N/A'}
                  </td>
                  <td className="px-4 py-3">{formatDateTime(item.collected_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
