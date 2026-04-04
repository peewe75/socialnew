import { FC } from 'react';

interface PlatformData {
  platform: string;
  views: number;
  engagement: number;
}

interface TopPlatformsProps {
  platforms?: PlatformData[];
}

const TopPlatforms: FC<TopPlatformsProps> = ({ platforms = [] }) => (
  <div className="card">
    <h3 className="text-lg font-bold text-gray-900 mb-4">Top Platforms</h3>
    <div className="space-y-3">
      {platforms.length === 0 ? (
        <p className="text-gray-400 text-center py-8">Nessun dato disponibile</p>
      ) : (
        platforms.map((platform) => (
          <div key={platform.platform} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 capitalize">{platform.platform}</p>
              <p className="text-sm text-gray-600">{platform.views.toLocaleString()} views</p>
            </div>
            <span className="badge badge-success">{platform.engagement.toFixed(1)}%</span>
          </div>
        ))
      )}
    </div>
  </div>
);

export default TopPlatforms;
