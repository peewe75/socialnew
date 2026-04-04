import { FC, useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { analyticsAPI } from '../utils/api';
import StatCard from '../components/StatCard';
import EngagementChart from '../components/EngagementChart';
import TopPlatforms from '../components/TopPlatforms';
import RecentActivity from '../components/RecentActivity';

interface DashboardData {
  summary: {
    totalPosts: number;
    totalViews: number;
    totalEngagement: number;
    averageEngagement: number;
    topPlatform: { name: string; views: number };
    platformBreakdown: Record<string, {
      platform: string;
      views: number;
      likes: number;
      comments: number;
      shares: number;
      engagement: number;
    }>;
    trends: {
      bestTime: string;
      bestContent: string;
      improvementAreas: string[];
    };
  };
  optimizations: {
    bestTime: string;
    bestStyle: string;
    recommendations: string[];
  };
  recentPosts: Array<{
    postId: string;
    platform: string;
    metrics: {
      views: number;
      likes: number;
      comments: number;
      shares: number;
      engagement: number;
    };
  }>;
}

function formatNumber(num: number): string {
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export const Dashboard: FC = () => {
  const { loading, setLoading, error, setError } = useAppStore();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
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
    fetchDashboardData();
  }, [setLoading, setError]);

  const summary = data?.summary;
  const platforms = summary?.platformBreakdown
    ? Object.values(summary.platformBreakdown).sort((a, b) => b.views - a.views)
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Benvenuto nel sistema di automazione social</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
          <p className="text-sm text-red-700 font-medium">
            Errore nel caricamento dei dati: {error}
          </p>
          <p className="text-xs text-red-500 mt-1">Assicurati che il backend sia in esecuzione su localhost:3001</p>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Posts"
              value={summary ? summary.totalPosts.toString() : '0'}
              change={summary && summary.totalPosts > 0 ? '+' + summary.totalPosts : '0'}
              icon="📝"
            />
            <StatCard
              title="Total Views"
              value={summary ? formatNumber(summary.totalViews) : '0'}
              change={summary && summary.totalViews > 0 ? '+' + formatNumber(summary.totalViews) : '0'}
              icon="👁️"
            />
            <StatCard
              title="Engagement Rate"
              value={summary ? summary.averageEngagement.toFixed(1) + '%' : '0%'}
              change={summary && summary.averageEngagement > 0 ? '+' + summary.averageEngagement.toFixed(1) + '%' : '0%'}
              icon="💬"
            />
            <StatCard
              title="Total Engagement"
              value={summary ? formatNumber(summary.totalEngagement) : '0'}
              change={summary && summary.totalEngagement > 0 ? '+' + formatNumber(summary.totalEngagement) : '0'}
              icon="❤️"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EngagementChart posts={data?.recentPosts || []} />
            <TopPlatforms platforms={platforms} />
          </div>

          {data?.optimizations && (
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Raccomandazioni AI</h3>
              <div className="space-y-2">
                {data.optimizations.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                    <span className="text-blue-600 font-bold mt-0.5">💡</span>
                    <p className="text-gray-800 text-sm">{rec}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Orario migliore per pubblicare: <strong>{data.optimizations.bestTime}</strong>
              </p>
            </div>
          )}

          <RecentActivity posts={data?.recentPosts || []} />
        </>
      )}
    </div>
  );
};

export default Dashboard;
