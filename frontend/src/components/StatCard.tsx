import { FC } from 'react';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: string;
}

const StatCard: FC<StatCardProps> = ({ title, value, change, icon }) => (
  <div className="card shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start">
      <div className="space-y-1">
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        <div className="flex items-center space-x-1 mt-1">
          <span className={`text-sm font-semibold ${change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
            {change}
          </span>
          <span className="text-xs text-gray-400">vs last week</span>
        </div>
      </div>
      <div className="bg-gray-50 p-2.5 rounded-xl text-3xl">
        {icon}
      </div>
    </div>
  </div>
);

export default StatCard;
