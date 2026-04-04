import { FC, useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { publishAPI } from '../utils/api';

interface Account {
  accountType: string;
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
  facebook: 'f',
  instagram: '📷',
  tiktok: '🎵',
};

export const Publishing: FC = () => {
  const { loading, setLoading, setError } = useAppStore();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filterPlatform, setFilterPlatform] = useState('all');

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await publishAPI.getAccounts();
      if (response.data.success) {
        setAccounts(response.data.accounts || []);
      }
    } catch (err: any) {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Publishing</h1>
        <p className="text-gray-600 mt-2">Gestisci le pubblicazioni sui social media</p>
      </div>

      {/* Account connessi */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">Account Connessi (Blotato)</h2>
          <button onClick={loadAccounts} disabled={loading} className="btn btn-primary text-sm disabled:opacity-50">
            🔄 Aggiorna
          </button>
        </div>

        {loading && accounts.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {!loading && accounts.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-2">Nessun account connesso</p>
            <p className="text-gray-400 text-sm">
              Configura le API keys di Blotato nella pagina Settings per connettere i tuoi account social.
            </p>
          </div>
        )}

        {accounts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {accounts.map((account, i) => (
              <div
                key={i}
                className={`p-4 rounded-lg border-2 ${
                  platformColors[account.accountType] || 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {platformIcons[account.accountType] || '��'}
                  </span>
                  <div>
                    <p className="font-bold capitalize">{account.accountType}</p>
                    <p className="text-sm opacity-75">{account.displayName}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    account.isActive ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                  }`}>
                    {account.isActive ? 'Attivo' : 'Inattivo'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filtri */}
      <div className="flex gap-2">
        {['all', 'linkedin', 'facebook', 'instagram', 'tiktok'].map((p) => (
          <button
            key={p}
            onClick={() => setFilterPlatform(p)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterPlatform === p
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {p === 'all' ? 'Tutte' : p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* Info */}
      <div className="card text-center py-12">
        <p className="text-gray-500 text-lg mb-2">Stato pubblicazioni</p>
        <p className="text-gray-400 text-sm">
          I post approvati nella pagina Approval vengono pubblicati automaticamente tramite Blotato.
          <br />
          Le metriche di engagement sono visibili nella pagina Analytics.
        </p>
      </div>
    </div>
  );
};

export default Publishing;
