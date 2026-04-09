import { FC, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

interface GeneratedPost {
  platform: string;
  content: string;
  hashtags: string[];
  mediaUrls?: string[];
}

interface ApprovalRequest {
  id: string;
  newsItemId: string;
  title: string;
  summary: string;
  source?: string;
  link?: string;
  imageUrl?: string;
  generatedPosts: GeneratedPost[];
  createdAt: string;
  expiresAt: string;
}

export const Approval: FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editedPosts, setEditedPosts] = useState<GeneratedPost[]>([]);

  const resumeUrl = searchParams.get('resumeUrl') || '';
  const isLegacyMode = Boolean(resumeUrl);

  // Fetch pending approvals on mount
  useEffect(() => {
    if (!isLegacyMode) {
      fetchPendingApprovals();
      const interval = setInterval(fetchPendingApprovals, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isLegacyMode]);

  const fetchPendingApprovals = async () => {
    try {
      const response = await axios.get('/api/approvals/pending');
      setApprovals(response.data.approvals || []);
      if (selectedApproval) {
        const updated = response.data.approvals.find((a: ApprovalRequest) => a.id === selectedApproval.id);
        if (updated) {
          setSelectedApproval(updated);
          setEditedPosts(updated.generatedPosts);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch approvals:', err.message);
      setError('Errore nel caricamento delle approvazioni');
    }
  };

  const handleApprove = async (approvalId: string) => {
    try {
      setProcessingId(approvalId);
      setError(null);

      await axios.post(`/api/approvals/${approvalId}/approve`);

      setApprovals(approvals.filter(a => a.id !== approvalId));
      setSelectedApproval(null);
      setEditMode(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Errore durante l\'approvazione');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (approvalId: string) => {
    if (!rejectionReason.trim()) {
      setError('Inserisci un motivo per il rifiuto');
      return;
    }

    try {
      setProcessingId(approvalId);
      setError(null);

      await axios.post(`/api/approvals/${approvalId}/reject`, {
        reason: rejectionReason,
      });

      setApprovals(approvals.filter(a => a.id !== approvalId));
      setSelectedApproval(null);
      setRejectionReason('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Errore durante il rifiuto');
    } finally {
      setProcessingId(null);
    }
  };

  const handleEditPost = (platform: string, content: string) => {
    const updated = editedPosts.map(p =>
      p.platform === platform ? { ...p, content } : p
    );
    setEditedPosts(updated);
  };

  const handleSaveEdits = async () => {
    if (!selectedApproval) return;

    try {
      setLoading(true);
      const edits = editedPosts
        .filter((p, i) => p.content !== selectedApproval.generatedPosts[i]?.content)
        .map(p => ({
          platform: p.platform,
          content: p.content,
          hashtags: p.hashtags,
        }));

      if (edits.length > 0) {
        await axios.post(`/api/approvals/${selectedApproval.id}/edit-posts`, { edits });
        setSelectedApproval({ ...selectedApproval, generatedPosts: editedPosts });
      }
      setEditMode(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Errore nel salvataggio delle modifiche');
    } finally {
      setLoading(false);
    }
  };

  // Legacy mode: quick approval from link
  if (isLegacyMode) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Approvazione Rapida</h1>
          <p className="text-gray-600 mt-2">Link di approvazione da email o Slack</p>
        </div>

        <div className="card text-center py-16">
          <p className="text-gray-700 text-lg mb-2">Approvazione da link</p>
          <p className="text-gray-500 text-sm">I link di approvazione rapida da email funzionano su questa pagina.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Approvazioni Contenuti</h1>
        <p className="text-gray-600 mt-2">
          {approvals.length === 0 ? 'Nessun contenuto in attesa di approvazione' : `${approvals.length} approvazione(i) in sospeso`}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-xs text-red-600 hover:text-red-800 mt-2 underline"
          >
            Chiudi
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Approval List */}
        <div className="lg:col-span-1">
          <div className="card space-y-2 max-h-96 overflow-y-auto">
            {approvals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Nessuna approvazione in sospeso</p>
              </div>
            ) : (
              approvals.map(approval => (
                <button
                  key={approval.id}
                  onClick={() => {
                    setSelectedApproval(approval);
                    setEditedPosts(approval.generatedPosts);
                    setEditMode(false);
                    setRejectionReason('');
                    setError(null);
                  }}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                    selectedApproval?.id === approval.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{approval.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{new Date(approval.createdAt).toLocaleString('it-IT')}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Approval Details */}
        {selectedApproval ? (
          <div className="lg:col-span-2 space-y-4">
            {/* Header */}
            <div className="card space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">{selectedApproval.title}</h2>
              <p className="text-gray-600 text-sm">{selectedApproval.summary}</p>

              {selectedApproval.link && (
                <a
                  href={selectedApproval.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center gap-2"
                >
                  🔗 Apri fonte
                </a>
              )}

              {selectedApproval.imageUrl && (
                <div className="mt-3 max-h-48 overflow-hidden rounded-lg">
                  <img
                    src={selectedApproval.imageUrl}
                    alt="Generated content"
                    className="w-full h-auto object-cover"
                  />
                </div>
              )}
            </div>

            {/* Generated Posts */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Contenuti Generati</h3>
                {!editMode ? (
                  <button
                    onClick={() => setEditMode(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    ✏️ Modifica
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditMode(false);
                        setEditedPosts(selectedApproval.generatedPosts);
                      }}
                      className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                    >
                      Annulla
                    </button>
                    <button
                      onClick={handleSaveEdits}
                      disabled={loading}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                    >
                      Salva
                    </button>
                  </div>
                )}
              </div>

              {editedPosts.map((post, index) => (
                <div key={`${post.platform}-${index}`}className="card space-y-2 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900 capitalize">{post.platform}</h4>
                    <span className="text-xs text-gray-500">{post.content.length} car.</span>
                  </div>

                  {editMode ? (
                    <textarea
                      value={post.content}
                      onChange={e => handleEditPost(post.platform, e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm font-mono resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                    />
                  ) : (
                    <p className="text-sm text-gray-700 leading-relaxed">{post.content}</p>
                  )}

                  {post.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {post.hashtags.map((tag, i) => (
                        <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            {!editMode && (
              <div className="card space-y-3 bg-gray-50">
                <button
                  onClick={() => handleApprove(selectedApproval.id)}
                  disabled={processingId === selectedApproval.id}
                  className="w-full btn btn-success disabled:opacity-50"
                >
                  {processingId === selectedApproval.id ? '⏳ Approvazione...' : '✅ Approva'}
                </button>

                <div className="space-y-2">
                  <textarea
                    placeholder="Motivo del rifiuto (opzionale)"
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={2}
                  />
                  <button
                    onClick={() => handleReject(selectedApproval.id)}
                    disabled={processingId === selectedApproval.id}
                    className="w-full btn btn-danger disabled:opacity-50"
                  >
                    {processingId === selectedApproval.id ? '⏳ Rifiuto...' : '❌ Rifiuta'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="lg:col-span-2 card text-center py-12 text-gray-500">
            <p>Seleziona un'approvazione per visualizzare i dettagli</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Approval;
