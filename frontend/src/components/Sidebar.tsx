import { FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SignOutButton } from '@clerk/clerk-react';
import { isClerkEnabled } from '../config/runtime';

const menuItems = [
  { icon: '📊', label: 'Dashboard', path: '/' },
  { icon: '📰', label: 'News', path: '/news' },
  { icon: '🚀', label: 'Publishing', path: '/publishing' },
  { icon: '📈', label: 'Analytics', path: '/analytics' },
  { icon: '⚙️', label: 'Settings', path: '/settings' },
];

export const Sidebar: FC = () => {
  const location = useLocation();
  const clerkEnabled = isClerkEnabled();

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-lg font-bold">Menu</h2>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path + '/'))
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700">
        {clerkEnabled ? (
          <SignOutButton>
            <button className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors">
              Logout
            </button>
          </SignOutButton>
        ) : (
          <div className="text-center text-xs text-gray-500">Dev Mode - No Auth</div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
