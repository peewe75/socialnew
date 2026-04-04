import { FC } from 'react';

interface RecentActivityProps {
  posts?: Array<{
    postId: string;
    platform: string;
    metrics: {
      views: number;
      likes: number;
      comments: number;
      shares: number;
    };
  }>;
}

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
              <p className="text-gray-900 capitalize">
                Post pubblicato su {post.platform}
              </p>
              <p className="text-xs text-gray-500">
                {post.metrics.views} views - {post.metrics.likes} likes - {post.metrics.comments} comments
              </p>
            </div>
            <span className="badge badge-success text-xs">Pubblicato</span>
          </div>
        ))
      )}
    </div>
  </div>
);

export default RecentActivity;
