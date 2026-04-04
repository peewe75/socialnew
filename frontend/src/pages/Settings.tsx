import { FC, useState } from 'react';

interface SettingsConfig {
  aiProvider: string;
  defaultTopics: string;
  autoApprove: boolean;
  n8nUrl: string;
  blotatoConnected: boolean;
}

export const Settings: FC = () => {
  const [config, setConfig] = useState<SettingsConfig>({
    aiProvider: 'openrouter',
    defaultTopics: 'tech, AI, innovation',
    autoApprove: false,
    n8nUrl: import.meta.env.VITE_N8N_URL || 'http://localhost:5678',
    blotatoConnected: false,
  });
  const [saved, setSaved] = useState(false);

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
        <p className="text-sm text-gray-600 mb-4">
          n8n gestisce i workflow automatizzati: raccolta news, generazione contenuti, approvazione e pubblicazione.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">URL n8n</label>
            <input
              type="text"
              value={config.n8nUrl}
              onChange={(e) => setConfig({ ...config, n8nUrl: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="http://localhost:5678"
            />
          </div>
          <a
            href={config.n8nUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 btn btn-primary"
          >
            🔗 Apri n8n Dashboard
          </a>
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Workflow disponibili:</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                01 - News Collection (Perplexity)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                02 - Content Generation (AI)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                03 - Approval Webhook
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                04 - Blotato Publishing
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                05 - Analytics Collection
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                06 - Full Pipeline (end-to-end)
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
            <p className="font-mono font-medium">{import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}</p>
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
