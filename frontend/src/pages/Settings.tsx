import { FC, useState, useEffect } from 'react';
import { n8nAPI } from '../utils/api';

interface SettingsConfig {
  aiProvider: string;
  defaultTopics: string;
  autoApprove: boolean;
  n8nUrl: string;
  blotatoConnected: boolean;
}

interface N8NStatus {
  reachable: boolean;
  loading: boolean;
  error?: string;
}

export const Settings: FC = () => {
  const apiBaseUrl =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD
      ? `${typeof window !== 'undefined' ? window.location.origin : ''}/api`
      : 'http://localhost:3001/api');
  const [config, setConfig] = useState<SettingsConfig>({
    aiProvider: 'openrouter',
    defaultTopics: 'tech, AI, innovation',
    autoApprove: false,
    n8nUrl: import.meta.env.VITE_N8N_URL || 'https://sbmbcs.app.n8n.cloud',
    blotatoConnected: false,
  });
  const [saved, setSaved] = useState(false);
  const [n8nStatus, setN8NStatus] = useState<N8NStatus>({ reachable: false, loading: true });

  useEffect(() => {
    checkN8NHealth();
  }, []);

  const checkN8NHealth = async () => {
    setN8NStatus(prev => ({ ...prev, loading: true }));
    try {
      const res = await n8nAPI.health();
      setN8NStatus({ reachable: res.data.n8n?.reachable ?? false, loading: false });
    } catch {
      setN8NStatus({ reachable: false, loading: false, error: 'Backend non raggiungibile' });
    }
  };

  const handleSave = () => {
    // I settings verranno salvati nel backend quando connesso
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Configura il sistema di automazione</p>
      </div>

      {saved && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg">
          <p className="text-sm text-green-700 font-medium">Impostazioni salvate con successo!</p>
        </div>
      )}

      {/* AI Provider */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-4">AI Provider</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
            <select
              value={config.aiProvider}
              onChange={(e) => setConfig({ ...config, aiProvider: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="openrouter">OpenRouter (Multi-model)</option>
              <option value="openai">OpenAI (GPT-4)</option>
              <option value="anthropic">Anthropic (Claude)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Le API keys vanno configurate nelle variabili d'ambiente del backend (.env)
            </p>
          </div>
        </div>
      </div>

      {/* Content Defaults */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Contenuti</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topics predefiniti (separati da virgola)
            </label>
            <input
              type="text"
              value={config.defaultTopics}
              onChange={(e) => setConfig({ ...config, defaultTopics: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="autoApprove"
              checked={config.autoApprove}
              onChange={(e) => setConfig({ ...config, autoApprove: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="autoApprove" className="text-sm text-gray-700">
              Approva automaticamente i contenuti generati (salta la fase di approvazione)
            </label>
          </div>
        </div>
      </div>

      {/* n8n Workflow Automation */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-4">n8n Workflow Automation</h2>
        <div className="flex items-center gap-2 mb-4">
          <span className={`w-3 h-3 rounded-full ${n8nStatus.loading ? 'bg-yellow-400 animate-pulse' : n8nStatus.reachable ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span className="text-sm text-gray-600">
            {n8nStatus.loading ? 'Verifica connessione...' : n8nStatus.reachable ? 'n8n Cloud connesso' : n8nStatus.error || 'n8n non raggiungibile'}
          </span>
          {!n8nStatus.loading && (
            <button onClick={checkN8NHealth} className="text-xs text-blue-600 hover:text-blue-800 ml-2">Ricontrolla</button>
          )}
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">URL n8n Cloud</label>
            <input
              type="text"
              value={config.n8nUrl}
              onChange={(e) => setConfig({ ...config, n8nUrl: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://sbmbcs.app.n8n.cloud"
            />
          </div>
          <a
            href={config.n8nUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 btn btn-primary"
          >
            Apri n8n Dashboard
          </a>
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Workflow attivo: News to Social - HITL Cloud</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Webhook Ricevi News
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Genera Contenuti (AI) via backend
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Notifiche Slack + Email
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                HITL Approval (Wait node + app resume)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                Pubblicazione (Upload media disattivato per text-only)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Schedule automatico ogni 6 ore
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Analytics report giornaliero
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Integrations */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Integrazioni</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📡</span>
              <div>
                <p className="font-medium text-gray-900">Blotato</p>
                <p className="text-sm text-gray-600">Pubblicazione multi-piattaforma</p>
              </div>
            </div>
            <span className="badge bg-yellow-100 text-yellow-800">Configura API Key nel .env</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔍</span>
              <div>
                <p className="font-medium text-gray-900">Perplexity</p>
                <p className="text-sm text-gray-600">Raccolta news in tempo reale</p>
              </div>
            </div>
            <span className="badge bg-yellow-100 text-yellow-800">Configura API Key nel .env</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎬</span>
              <div>
                <p className="font-medium text-gray-900">Avatar Hygen</p>
                <p className="text-sm text-gray-600">Generazione video con avatar AI</p>
              </div>
            </div>
            <span className="badge bg-yellow-100 text-yellow-800">Configura API Key nel .env</span>
          </div>
        </div>
      </div>

      {/* Environment Info */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Ambiente</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Backend API</p>
            <p className="font-mono font-medium">{apiBaseUrl}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-600">n8n URL</p>
            <p className="font-mono font-medium">{config.n8nUrl}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Ambiente</p>
            <p className="font-mono font-medium">{import.meta.env.MODE}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Versione</p>
            <p className="font-mono font-medium">1.0.0</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} className="btn btn-primary px-8">
          Salva Impostazioni
        </button>
      </div>
    </div>
  );
};

export default Settings;
