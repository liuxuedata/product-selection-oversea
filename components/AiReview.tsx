"use client";

import { useState, useEffect } from "react";

type Props = {
  product: any;
};

export default function AiReview({ product }: Props) {
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState("");
  const [error, setError] = useState("");
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]);

  useEffect(() => {
    const p = localStorage.getItem("ai_provider");
    const m = localStorage.getItem("ai_model");
    if (p) setProvider(p);
    if (m) setModel(m);
    
    // 加载分析历史
    const history = localStorage.getItem(`ai_analysis_${product.row_id || product.id}`);
    if (history) {
      setAnalysisHistory(JSON.parse(history));
    }
  }, [product.row_id, product.id]);

  async function handleGenerate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, provider, model }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setReview("");
      } else {
        const newReview = data.review || "暂无点评";
        setReview(newReview);
        setError("");
        
        // 保存到历史记录
        const newAnalysis = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          review: newReview,
          product: {
            title: product.title,
            asin: product.asin,
            price: product.price
          }
        };
        const updatedHistory = [newAnalysis, ...analysisHistory.slice(0, 4)]; // 保留最近5次
        setAnalysisHistory(updatedHistory);
        localStorage.setItem(`ai_analysis_${product.row_id || product.id}`, JSON.stringify(updatedHistory));
      }
    } catch (e) {
      setError("AI 分析失败，请检查网络连接或API配置");
    } finally {
      setLoading(false);
    }
  }

  function handleClearHistory() {
    setAnalysisHistory([]);
    localStorage.removeItem(`ai_analysis_${product.row_id || product.id}`);
  }

  function loadHistoryAnalysis(analysis: any) {
    setReview(analysis.review);
    setError("");
  }

  return (
    <div className="space-y-4">
      {/* 标题和操作按钮 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">🤖 AI 选品专家分析</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-sm px-3 py-1 border rounded hover:bg-gray-50"
          >
            {showSettings ? "隐藏设置" : "设置"}
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                AI 分析中...
              </span>
            ) : (
              "开始 AI 分析"
            )}
          </button>
        </div>
      </div>

      {/* 设置面板 */}
      {showSettings && (
        <div className="p-4 border rounded-lg bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">AI 服务商</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="openai">OpenAI</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">模型</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </select>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 提示：确保在环境变量中正确配置了 AI_API_KEY
          </p>
        </div>
      )}

      {/* 错误信息 */}
      {error && (
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <span>⚠️</span>
            <span className="font-medium">分析失败</span>
          </div>
          <p className="text-red-700 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* 分析结果 */}
      {review && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-blue-50 px-4 py-2 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-blue-800 font-medium">📊 AI 分析报告</span>
                <span className="text-xs text-blue-600">
                  {new Date().toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setReview("")}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                清除
              </button>
            </div>
          </div>
          <div className="p-4">
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-line text-gray-800 leading-relaxed">
                {review}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 分析历史 */}
      {analysisHistory.length > 0 && (
        <div className="border rounded-lg">
          <div className="bg-gray-50 px-4 py-2 border-b flex items-center justify-between">
            <h4 className="font-medium text-gray-800">📚 分析历史</h4>
            <button
              onClick={handleClearHistory}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              清除历史
            </button>
          </div>
          <div className="p-4 space-y-3">
            {analysisHistory.map((analysis) => (
              <div key={analysis.id} className="border rounded p-3 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-600">
                    {new Date(analysis.timestamp).toLocaleString()}
                  </div>
                  <button
                    onClick={() => loadHistoryAnalysis(analysis)}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    查看
                  </button>
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {analysis.product.title || analysis.product.asin || "未知产品"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 使用提示 */}
      {!review && !loading && (
        <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-blue-600 text-lg">💡</span>
            <div>
              <h4 className="font-medium text-blue-800 mb-1">AI 选品专家分析</h4>
              <p className="text-blue-700 text-sm">
                点击&ldquo;开始 AI 分析&rdquo;按钮，我们的AI选品专家将为您提供：
              </p>
              <ul className="text-blue-700 text-sm mt-2 space-y-1">
                <li>• 市场潜力评估和竞争分析</li>
                <li>• 产品竞争力分析和风险评估</li>
                <li>• 专业的选品建议和进入策略</li>
                <li>• 适合平台推荐和目标市场建议</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
