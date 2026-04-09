import { FC, useEffect, useMemo, useState } from 'react';
import { publishAPI } from '../utils/api';

interface RawAccount {
  accountType?: string;
  platform?: string;
  type?: string;
  displayName?: string;
  name?: string;
  username?: string;
  profileUrl?: string;
  id?: string;
  isActive?: boolean;
  active?: boolean;
}

interface AccountView {
  platform: string;
  displayName: string;
  profileUrl?: string;
  isActive: boolean;
}

const platformColors: Record<string, string> = {
  linkedin: 'bg-blue-100 text-blue-800 border-blue-200',
  facebook: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  instagram: 'bg-pink-100 text-pink-800 border-pink-200',
  tiktok: 'bg-gray-100 text-gray-800 border-gray-200',
};

const platformIcons: Record<string, string> = {
  linkedin: '💼',
  facebook: '📘',
  instagram: '📷',
  tiktok: '🎵',
};

function normalizeAccount(account: RawAccount): AccountView {
  return {
    platform: String(account.accountType || account.platform || account.type || 'unknown').toLowerCase(),
    displayName: String(account.displayName || account.name || account.username || account.profileUrl || account.id || 'Account collegato'),
    profileUrl: account.profileUrl,
    isActive: account.isActive ?? account.active ?? true,
  };
}

export const Publishing: FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<AccountView[]>([]);
  const [filterPlatform, setFilterPlatform] = useState('all');

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await publishAPI.getAccounts();
      if (response.data.success) {
        setAccounts((response.data.accounts || []).map(normalizeAccount));
      } else {
        setAccounts([]);
      }
    } catch (err: any) {
      setAccounts([]);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const filteredAccounts = useMemo(() => {
    if (filterPlatform === 'all') return accounts;
    return accounts.filter((account) => account.platform === filterPlatform);
  }, [accounts, filterPlatform]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Publishing</h1>
        <p className="text-gray-600 mt-2">Gestisci le pubblicazioni sui social media</p>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">Account Connessi (Blotato)</h2>
          <button onClick={loadAccounts} disabled={loading} className="btn btn-primary text-sm disabled:opacity-50">
            {loading ? 'Aggiornamento...' : 'Aggiorna'}
          </button>
        </div>

        {loading && accounts.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!loading && accounts.length === 0 && !error && (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-2">Nessun account connesso</p>
            <p className="text-gray-400 text-sm">
              Collega i social in Blotato e poi premi Aggiorna per rilevare gli account attivi.
            </p>
          </div>
        )}

        {accounts.length > 0 && (
          <>
            <div className="flex gap-2 mb-4">
              {['all', 'linkedin', 'facebook', 'instagram', 'tiktok'].map((platform) => (
                <button
                  key={platform}
                  onClick={() => setFilterPlatform(platform)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterPlatform === platform
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {platform === 'all' ? 'Tutte' : platform.charAt(0).toUpperCase() + platform.slice(1)}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredAccounts.map((account, index) => (
                <div
                  key={`${account.platform}-${account.displayName}-${index}`}
                  className={`p-4 rounded-lg border-2 ${
                    platformColors[account.platform] || 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{platformIcons[account.platform] || '🔗'}</span>
                    <div>
                      <p className="font-bold capitalize">{account.platform}</p>
                      <p className="text-sm opacity-75">{account.displayName}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        account.isActive ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                      }`}
                    >
                      {account.isActive ? 'Attivo' : 'Inattivo'}
                    </span>
                    {account.profileUrl && (
                      <a
                        href={account.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-700 hover:text-blue-800"
                      >
                        Apri profilo
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="card text-center py-12">
        <p className="text-gray-500 text-lg mb-2">Stato pubblicazioni</p>
        <p className="text-gray-400 text-sm">
          I contenuti approvati vengono pubblicati tramite il workflow HITL e il backend.
          <br />
          In questo momento il flusso attivo è text-only, con Facebook come canale abilitato in produzione.
        </p>
      </div>
    </div>
  );
};

export default Publishing;
