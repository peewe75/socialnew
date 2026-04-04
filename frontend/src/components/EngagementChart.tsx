import { FC } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface EngagementChartProps {
  posts?: Array<{
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

export const EngagementChart: FC<EngagementChartProps> = ({ posts = [] }) => {
  // Trasforma i dati dei post in dati per il grafico
  const chartData = posts.length > 0
    ? posts.map((post) => ({
        name: post.platform.charAt(0).toUpperCase() + post.platform.slice(1),
        views: post.metrics.views,
        likes: post.metrics.likes,
        engagement: Number(post.metrics.engagement.toFixed(1)),
      }))
    : [
        { name: 'LinkedIn', views: 0, likes: 0, engagement: 0 },
        { name: 'Facebook', views: 0, likes: 0, engagement: 0 },
        { name: 'Instagram', views: 0, likes: 0, engagement: 0 },
      ];

  return (
    <div className="card">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Engagement per Piattaforma</h3>
      {posts.length === 0 ? (
        <div className="flex items-center justify-center h-[300px] text-gray-400">
          <p>Nessun dato disponibile - pubblica dei contenuti per vedere i grafici</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="views" stroke="#0A66C2" strokeWidth={2} name="Views" />
            <Line type="monotone" dataKey="likes" stroke="#10B981" strokeWidth={2} name="Likes" />
            <Line type="monotone" dataKey="engagement" stroke="#E4405F" strokeWidth={2} name="Engagement %" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default EngagementChart;
