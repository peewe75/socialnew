import { FC } from 'react';

interface RecentActivityProps {
  posts?: Array<{
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
    };
  }>;
}

const getBadgeClass = (status?: string) => {
  if (status === 'published') return 'badge-success';
  if (status === 'failed') return 'badge-error';
  return 'badge-warning';
};

const getStatusLabel = (status?: string) => {
  if (status === 'published') return 'Pubblicato';
  if (status === 'failed') return 'Errore';
  return 'In sincronizzazione';
};

const RecentActivity: FC<RecentActivityProps> = ({ posts = [] }) => (
  <div className="card">
    <h3 className="text-lg font-bold text-gray-900 mb-4">Attivita' Recente</h3>
    <div className="space-y-2">
      {posts.length === 0 ? (
        <p className="text-gray-400 text-center py-4">Nessuna attivita' recente</p>
      ) : (
        posts.map((post, i) => (
          <div key={post.postId || i} className="flex justify-between items-center p-3 border-b border-gray-200">
            <div>
              <p className="text-gray-900 capitalize font-medium">
                {post.title || `Post su ${post.platform}`}
              </p>
              <p className="text-xs text-gray-500">
                {post.platform} - {post.metrics.views} views - {post.metrics.likes} likes - {post.metrics.comments} comments
              </p>
              {post.lastUpdated && (
                <p className="text-xs text-gray-400 mt-1">
                  Ultimo sync: {new Date(post.lastUpdated).toLocaleString('it-IT')}
                </p>
              )}
            </div>
            <span className={`badge text-xs ${getBadgeClass(post.status)}`}>{getStatusLabel(post.status)}</span>
          </div>
        ))
      )}
    </div>
  </div>
);

export default RecentActivity;
