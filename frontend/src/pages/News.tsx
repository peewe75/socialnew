import { FC, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { newsAPI } from '../utils/api';

export const News: FC = () => {
  const { loading, setLoading, setError, news, setNews } = useAppStore();
  const [topics, setTopics] = useState('tech, AI, innovation');

  const handleCollectNews = async () => {
    try {
      setLoading(true);
      const response = await newsAPI.collect(topics, 3);
      setNews(response.data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">News Collection</h1>
        <p className="text-gray-600 mt-2">Raccogli e gestisci le news da pubblicare</p>
      </div>

      {/* Collection Form */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Collect News</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topics (comma-separated)
            </label>
            <input
              type="text"
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., tech, AI, innovation"
            />
          </div>

          <button
            onClick={handleCollectNews}
            disabled={loading}
            className="btn btn-primary disabled:opacity-50"
          >
            {loading ? 'Collecting...' : '🔍 Collect News'}
          </button>
        </div>
      </div>

      {/* News List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Collected News ({news.length})</h2>
        {news.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600">No news collected yet. Use the form above to collect news.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {news.map((item) => (
              <NewsCard key={item.id} news={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const NewsCard: FC<{ news: any }> = ({ news }) => (
  <div className="card">
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-bold text-gray-900">{news.title}</h3>
        <p className="text-gray-600 text-sm mt-1">{news.source}</p>
      </div>
      <p className="text-gray-700">{news.summary}</p>
      <div className="flex justify-between items-center">
        <a
          href={news.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Read more →
        </a>
        <span className="text-sm text-gray-500">{news.date}</span>
      </div>
    </div>
  </div>
);

export default News;