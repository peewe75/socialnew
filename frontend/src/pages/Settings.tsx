import { FC, useEffect, useMemo, useState } from 'react';
import { getPreferredAppOrigin } from '../config/runtime';
import { n8nAPI, publishAPI } from '../utils/api';

interface N8NConfigResponse {
  config: {
    webhookUrl: string;
    webhookSecretSet: boolean;
    n8nReachable: boolean;
    integrations?: {
      ai?: {
        configured: boolean;
        provider?: string;
        model?: string;
        newsCollectionModel?: string;
      };
      blotato?: {
        configured: boolean;
        allowedPlatforms?: string[];
      };
      avatarHygen?: {
        configured: boolean;
      };
    };
  };
  workflow: {
    name: string;
    id: string;
    trigger: string;
    platforms: string[];
    publishingMode?: string;
    textOnly?: boolean;
    features: string[];
  };
}

interface N8NStatus {
  reachable: boolean;
  loading: boolean;
  error?: string;
}

interface ConnectedAccount {
  accountType?: string;
  platform?: string;
  type?: string;
  displayName?: string;
  name?: string;
  isActive?: boolean;
  active?: boolean;
}

function statusBadge(connected: boolean, labelWhenTrue: string, labelWhenFalse: string) {
  return connected ? (
    <span className="badge bg-green-100 text-green-800">{labelWhenTrue}</span>
  ) : (
    <span className="badge bg-yellow-100 text-yellow-800">{labelWhenFalse}</span>
  );
}

export const Settings: FC = () => {
  const apiBaseUrl = `${getPreferredAppOrigin()}/api`;
  const [n8nStatus, setN8NStatus] = useState<N8NStatus>({ reachable: false, loading: true });
  const [config, setConfig] = useState<N8NConfigResponse | null>(null);
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [saved, setSaved] = useState(false);

  const loadStatus = async () => {
    setN8NStatus((prev) => ({ ...prev, loading: true }));
    try {
      const [healthRes, configRes, accountsRes] = await Promise.all([
        n8nAPI.health(),
        n8nAPI.config(),
        publishAPI.getAccounts(),
      ]);

      setN8NStatus({ reachable: healthRes.data.n8n?.reachable ?? false, loading: false });
      setConfig(configRes.data);
      setAccounts(accountsRes.data.accounts || []);
    } catch (error: any) {
      setN8NStatus({
        reachable: false,
        loading: false,
        error: error.response?.data?.error || 'Backend non raggiungibile',
      });
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const activeAccounts = useMemo(
    () => accounts.filter((account) => (account.isActive ?? account.active ?? true)),
    [accounts]
  );
  const blotatoConnected = activeAccounts.length > 0;
  const aiConfigured = Boolean(config?.config.integrations?.ai?.configured);
  const avatarConfigured = Boolean(config?.config.integrations?.avatarHygen?.configured);
  const publishingMode = config?.workflow.publishingMode || 'unknown';
  const publishingLabel =
    publishingMode === 'facebook-text-only'
      ? 'Pubblicazione attiva (solo Facebook, text-only via backend)'
      : publishingMode === 'multi-platform-text-only'
      ? 'Pubblicazione attiva (text-only via backend)'
      : 'Pubblicazione da verificare';

  const handleSave = async () => {
    await loadStatus();
    setSaved(true);
    window.setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Verifica stato reale del sistema e delle integrazioni.</p>
      </div>

      {saved && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
          <p className="text-sm text-blue-700 font-medium">
            Stato aggiornato dal backend con successo.
          </p>
        </div>
      )}

      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-4">n8n Workflow Automation</h2>
        <div className="flex items-center gap-2 mb-4">
          <span
            className={`w-3 h-3 rounded-full ${
              n8nStatus.loading ? 'bg-yellow-400 animate-pulse' : n8nStatus.reachable ? 'bg-green-500' : 'bg-red-500'
            }`}
          ></span>
          <span className="text-sm text-gray-600">
            {n8nStatus.loading
              ? 'Verifica connessione...'
              : n8nStatus.reachable
              ? 'n8n Cloud connesso'
              : n8nStatus.error || 'n8n non raggiungibile'}
          </span>
          {!n8nStatus.loading && (
            <button onClick={loadStatus} className="text-xs text-blue-600 hover:text-blue-800 ml-2">
              Ricontrolla
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">URL n8n Cloud</label>
            <input
              type="text"
              readOnly
              value="https://sbmbcs.app.n8n.cloud"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>

          <a
            href="https://sbmbcs.app.n8n.cloud"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 btn btn-primary"
          >
            Apri n8n Dashboard
          </a>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">
              Workflow attivo: {config?.workflow.name || 'News to Social - HITL Cloud'}
            </h3>
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
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                {publishingLabel}
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

      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Integrazioni</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📡</span>
              <div>
                <p className="font-medium text-gray-900">Blotato</p>
                <p className="text-sm text-gray-600">
                  {blotatoConnected
                    ? `${activeAccounts.length} account connesso/i`
                    : 'Pubblicazione multi-piattaforma'}
                </p>
              </div>
            </div>
            {statusBadge(blotatoConnected, 'Connesso', 'Configura account in Blotato')}
          </div>

          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔎</span>
              <div>
                <p className="font-medium text-gray-900">Raccolta News AI</p>
                <p className="text-sm text-gray-600">
                  {config?.config.integrations?.ai?.provider || 'openrouter'} ·{' '}
                  {config?.config.integrations?.ai?.newsCollectionModel || 'perplexity/sonar'}
                </p>
              </div>
            </div>
            {statusBadge(aiConfigured, 'Configurato', 'Configura AI_API_KEY')}
          </div>

          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎬</span>
              <div>
                <p className="font-medium text-gray-900">Avatar Hygen</p>
                <p className="text-sm text-gray-600">Generazione video con avatar AI</p>
              </div>
            </div>
            {statusBadge(avatarConfigured, 'Configurato', 'Non configurato')}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Ambiente</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Backend API</p>
            <p className="font-mono font-medium">{apiBaseUrl}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-600">n8n URL</p>
            <p className="font-mono font-medium">https://sbmbcs.app.n8n.cloud</p>
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
        <button onClick={handleSave} className="btn btn-secondary px-8">
          Rileggi stato sistema
        </button>
      </div>
    </div>
  );
};

export default Settings;
