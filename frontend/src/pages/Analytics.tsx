import { FC, useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { analyticsAPI } from '../utils/api';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

interface PlatformMetrics {
  platform: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagement: number;
}

interface AnalyticsData {
  summary: {
    totalPosts: number;
    totalViews: number;
    totalEngagement: number;
    averageEngagement: number;
    topPlatform: { name: string; views: number };
    platformBreakdown: Record<string, PlatformMetrics>;
    trends: {
      bestTime: string;
      bestContent: string;
      improvementAreas: string[];
    };
  };
  optimizations: {
    bestTime: string;
    recommendations: string[];
    contentTypes: Record<string, number>;
  };
  recentPosts: Array<{
    postId: string;
    platform: string;
    metrics: PlatformMetrics;
  }>;
}

function formatNumber(num: number): string {
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export const Analytics: FC = () => {
  const { loading, setLoading, error, setError } = useAppStore();
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyticsAPI.getDashboard();
      if (response.data.success) {
        setData(response.data.dashboard);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const platformBreakdown = data?.summary?.platformBreakdown
    ? Object.values(data.summary.platformBreakdown)
    : [];

  const chartData = platformBreakdown.map(p => ({
    name: p.platform.charAt(0).toUpperCase() + p.platform.slice(1),
    views: p.views,
    likes: p.likes,
    comments: p.comments,
    shares: p.shares,
    engagement: Number(p.engagement.toFixed(1)),
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-2">Monitora le performance dei tuoi contenuti</p>
        </div>
        <button onClick={loadAnalytics} disabled={loading} className="btn btn-primary disabled:opacity-50">
          🔄 Aggiorna
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card text-center">
              <p className="text-gray-500 text-sm">Total Views</p>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(data.summary.totalViews)}</p>
            </div>
            <div className="card text-center">
              <p className="text-gray-500 text-sm">Total Engagement</p>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(data.summary.totalEngagement)}</p>
            </div>
            <div className="card text-center">
              <p className="text-gray-500 text-sm">Avg Engagement</p>
              <p className="text-3xl font-bold text-gray-900">{data.summary.averageEngagement.toFixed(1)}%</p>
            </div>
            <div className="card text-center">
              <p className="text-gray-500 text-sm">Top Platform</p>
              <p className="text-3xl font-bold text-gray-900 capitalize">{data.summary.topPlatform.name}</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance per piattaforma */}
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Performance per Piattaforma</h3>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="views" fill="#3B82F6" name="Views" />
                    <Bar dataKey="likes" fill="#10B981" name="Likes" />
                    <Bar dataKey="comments" fill="#F59E0B" name="Comments" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-8">Nessun dato disponibile</p>
              )}
            </div>

            {/* Engagement Rate */}
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Engagement Rate (%)</h3>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="engagement" fill="#8B5CF6" name="Engagement %" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-8">Nessun dato disponibile</p>
              )}
            </div>
          </div>

          {/* Trends & Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Trend & Insights</h3>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Orario migliore</p>
                  <p className="font-bold text-gray-900">{data.summary.trends.bestTime}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Contenuto migliore</p>
                  <p className="font-bold text-gray-900 capitalize">{data.summary.trends.bestContent}</p>
                </div>
                {data.summary.trends.improvementAreas.map((area, i) => (
                  <div key={i} className="p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-800">{area}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Raccomandazioni</h3>
              <div className="space-y-2">
                {data.optimizations.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                    <span className="text-blue-600 font-bold mt-0.5">💡</span>
                    <p className="text-sm text-gray-800">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Platform Details */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Dettaglio Piattaforme</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 px-4 text-sm font-medium text-gray-600">Piattaforma</th>
                    <th className="py-3 px-4 text-sm font-medium text-gray-600">Views</th>
                    <th className="py-3 px-4 text-sm font-medium text-gray-600">Likes</th>
                    <th className="py-3 px-4 text-sm font-medium text-gray-600">Comments</th>
                    <th className="py-3 px-4 text-sm font-medium text-gray-600">Shares</th>
                    <th className="py-3 px-4 text-sm font-medium text-gray-600">Engagement</th>
                  </tr>
                </thead>
                <tbody>
                  {platformBreakdown.map((p) => (
                    <tr key={p.platform} className="border-b border-gray-100">
                      <td className="py-3 px-4 font-medium capitalize">{p.platform}</td>
                      <td className="py-3 px-4">{formatNumber(p.views)}</td>
                      <td className="py-3 px-4">{formatNumber(p.likes)}</td>
                      <td className="py-3 px-4">{formatNumber(p.comments)}</td>
                      <td className="py-3 px-4">{formatNumber(p.shares)}</td>
                      <td className="py-3 px-4">
                        <span className="badge badge-success">{p.engagement.toFixed(1)}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!loading && !error && !data && (
        <div className="card text-center py-16">
          <p className="text-gray-500 text-lg mb-2">Nessun dato analytics disponibile</p>
          <p className="text-gray-400 text-sm">Pubblica dei contenuti per iniziare a raccogliere metriche</p>
        </div>
      )}
    </div>
  );
};

export default Analytics;
