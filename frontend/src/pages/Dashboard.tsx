import { FC, useCallback, useEffect, useState } from 'react';
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
    platformBreakdown: Record<
      string,
      {
        platform: string;
        views: number;
        likes: number;
        comments: number;
        shares: number;
        engagement: number;
      }
    >;
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
    title?: string;
    status?: string;
    lastUpdated?: string;
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
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async (silent: boolean = false) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);
      const response = await analyticsAPI.getDashboard();
      if (response.data.success) {
        setData(response.data.dashboard);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData(false);

    const intervalId = window.setInterval(() => {
      fetchDashboardData(true);
    }, 60000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchDashboardData(true);
      }
    };

    const handleFocus = () => fetchDashboardData(true);

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchDashboardData]);

  const syncAndRefresh = async () => {
    try {
      setSyncing(true);
      setError(null);
      await analyticsAPI.sync();
      await fetchDashboardData(true);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSyncing(false);
    }
  };

  const summary = data?.summary;
  const platforms = summary?.platformBreakdown
    ? Object.values(summary.platformBreakdown).sort((a, b) => b.views - a.views)
    : [];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Benvenuto nel sistema di automazione social</p>
        </div>
        <div className="flex items-center gap-3">
          {refreshing && <span className="text-xs text-gray-400">Aggiornamento in background…</span>}
          <button
            onClick={syncAndRefresh}
            disabled={loading || syncing}
            className="btn btn-secondary disabled:opacity-50"
          >
            {syncing ? 'Sincronizzazione...' : 'Sincronizza analytics'}
          </button>
        </div>
      </div>

      {loading && !data && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
          <p className="text-sm text-red-700 font-medium">Errore nel caricamento dei dati: {error}</p>
          <p className="text-xs text-red-500 mt-1">
            Ricarica la pagina o riprova con una sincronizzazione manuale.
          </p>
        </div>
      )}

      {!loading && !error && data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Posts"
              value={summary ? summary.totalPosts.toString() : '0'}
              change={summary && summary.totalPosts > 0 ? `+${summary.totalPosts}` : '0'}
              icon="📝"
            />
            <StatCard
              title="Total Views"
              value={summary ? formatNumber(summary.totalViews) : '0'}
              change={summary && summary.totalViews > 0 ? `+${formatNumber(summary.totalViews)}` : '0'}
              icon="👁️"
            />
            <StatCard
              title="Engagement Rate"
              value={summary ? `${summary.averageEngagement.toFixed(1)}%` : '0%'}
              change={
                summary && summary.averageEngagement > 0
                  ? `+${summary.averageEngagement.toFixed(1)}%`
                  : '0%'
              }
              icon="💬"
            />
            <StatCard
              title="Total Engagement"
              value={summary ? formatNumber(summary.totalEngagement) : '0'}
              change={
                summary && summary.totalEngagement > 0 ? `+${formatNumber(summary.totalEngagement)}` : '0'
              }
              icon="❤️"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EngagementChart posts={data.recentPosts || []} />
            <TopPlatforms platforms={platforms} />
          </div>

          {data.optimizations && (
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Raccomandazioni AI</h3>
              <div className="space-y-2">
                {data.optimizations.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
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

          <RecentActivity posts={data.recentPosts || []} />
        </>
      )}
    </div>
  );
};

export default Dashboard;
