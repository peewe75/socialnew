import { FC } from 'react';
import { UserButton, useUser } from '@clerk/clerk-react';
import { useAppStore } from '../store/appStore';

const CLERK_ENABLED = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export const Navigation: FC = () => {
  const { error, setError } = useAppStore();
  const { user } = CLERK_ENABLED ? useUser() : { user: null };

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container flex justify-between items-center h-16">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">N</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">News to Social</h1>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4">
          {/* Error notification */}
          {error && (
            <div className="flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-lg">
              <span className="text-sm">{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-800 hover:text-red-900 font-bold"
              >
                x
              </button>
            </div>
          )}

          {/* User info */}
          {CLERK_ENABLED ? (
            <div className="flex items-center gap-3">
              {user && <span className="text-sm text-gray-700">{user.firstName || user.emailAddresses?.[0]?.emailAddress}</span>}
              <UserButton afterSignOutUrl="/" />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
              <span className="text-sm text-gray-700">Dev Mode</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navigation;
