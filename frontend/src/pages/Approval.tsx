import { FC, useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { approvalAPI, publishAPI, newsAPI } from '../utils/api';
import PostPreview from '../components/PostPreview';

interface ApprovalPost {
  newsId: string;
  title: string;
  summary?: string;
  status: string;
  posts: {
    platform: string;
    content: string;
    hashtags: string[];
  }[];
  blogPost?: string;
}

export const Approval: FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loading, setLoading, error, setError } = useAppStore();
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<ApprovalPost | null>(null);
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});
  const [scheduleTime, setScheduleTime] = useState('');
  const [publishResult, setPublishResult] = useState<string | null>(null);
  const [resumeResult, setResumeResult] = useState<string | null>(null);

  const resumeUrl = searchParams.get('resumeUrl') || '';
  const quickTitle = searchParams.get('title') || '';
  const quickLink = searchParams.get('link') || '';
  const quickPlatforms = (searchParams.get('platforms') || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const quickPreview = searchParams.get('preview') || '';
  const isQuickApprovalMode = Boolean(resumeUrl);

  useEffect(() => {
    if (isQuickApprovalMode) {
      return;
    }
    loadPendingApprovals();
  }, [isQuickApprovalMode]);

  const handleResumeApproval = async (approved: boolean) => {
    if (!resumeUrl) return;

    try {
      setLoading(true);
      setError(null);
      setResumeResult(null);

      await approvalAPI.resume({ resumeUrl, approved });

      setResumeResult(
        approved
          ? 'Approvazione inviata correttamente al workflow.'
          : 'Rifiuto inviato correttamente al workflow.'
      );
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.details?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingApprovals = async () => {
    try {
      setLoading(true);
      setError(null);

      // Carica i post generati che sono in attesa di approvazione
      const response = await newsAPI.list();
      const newsItems = response.data.data || [];

      // Se non ci sono dati dal backend, mostra stato vuoto
      if (newsItems.length === 0) {
        setPendingApprovals([]);
        setSelectedPost(null);
        return;
      }

      const approvals: ApprovalPost[] = newsItems.map((item: any) => ({
        newsId: item.id || item.newsId,
        title: item.title,
        summary: item.summary,
        status: item.status || 'pending',
        posts: item.posts || item.generatedPosts || [],
        blogPost: item.blogPostMarkdown || item.blogPost || '',
      }));

      setPendingApprovals(approvals);

      // Se c'e' un ID specifico, seleziona quello
      if (id) {
        const found = approvals.find(a => a.newsId === id);
        setSelectedPost(found || approvals[0] || null);
      } else {
        setSelectedPost(approvals[0] || null);
      }
    } catch (err: any) {
      // Se il backend non e' connesso, mostra stato vuoto
      setPendingApprovals([]);
      setSelectedPost(null);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedPost) return;

    try {
      setLoading(true);
      setError(null);
      setPublishResult(null);

      const edits = Object.entries(editedContent).map(([platform, content]) => ({
        platform,
        content,
      }));

      const response = await publishAPI.approve({
        newsId: selectedPost.newsId,
        approved: true,
        platforms: selectedPost.posts.map(p => p.platform),
        generatedPosts: selectedPost.posts.map(p => ({
          ...p,
          content: editedContent[p.platform] || p.content,
        })),
        edits: edits.length > 0 ? edits : undefined,
        scheduledTime: scheduleTime || undefined,
      });

      if (response.data.success) {
        const results = response.data.results;
        setPublishResult(
          `Pubblicato con successo! ${results?.successful || 0}/${results?.total || 0} piattaforme.`
        );
        // Rimuovi dalla lista
        const updated = pendingApprovals.filter(p => p.newsId !== selectedPost.newsId);
        setPendingApprovals(updated);
        setSelectedPost(updated[0] || null);
        setEditedContent({});
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPost) return;

    try {
      setLoading(true);
      await publishAPI.approve({
        newsId: selectedPost.newsId,
        approved: false,
      });

      const updated = pendingApprovals.filter(p => p.newsId !== selectedPost.newsId);
      setPendingApprovals(updated);
      setSelectedPost(updated[0] || null);
      setEditedContent({});
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Approval</h1>
          <p className="text-gray-600 mt-2">Rivedi e approva i contenuti prima della pubblicazione</p>
        </div>
        <button
          onClick={loadPendingApprovals}
          disabled={loading}
          className="btn btn-primary disabled:opacity-50"
        >
          🔄 Aggiorna
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {publishResult && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg">
          <p className="text-sm text-green-700 font-medium">{publishResult}</p>
        </div>
      )}

      {resumeResult && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg">
          <p className="text-sm text-green-700 font-medium">{resumeResult}</p>
        </div>
      )}

      {isQuickApprovalMode && (
        <div className="space-y-6">
          <div className="card space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{quickTitle || 'Richiesta di approvazione'}</h2>
              {quickLink && (
                <a
                  href={quickLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Apri fonte
                </a>
              )}
            </div>

            {quickPlatforms.length > 0 && (
              <p className="text-sm text-gray-600">
                Piattaforme: {quickPlatforms.join(', ')}
              </p>
            )}

            {quickPreview && (
              <textarea
                readOnly
                value={quickPreview}
                className="w-full h-80 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm bg-gray-50"
              />
            )}

            <div className="flex gap-3">
              <button
                onClick={() => handleResumeApproval(true)}
                disabled={loading}
                className="flex-1 btn btn-success disabled:opacity-50"
              >
                {loading ? 'Invio...' : 'Approva'}
              </button>
              <button
                onClick={() => handleResumeApproval(false)}
                disabled={loading}
                className="flex-1 btn btn-danger disabled:opacity-50"
              >
                {loading ? 'Invio...' : 'Rifiuta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {!isQuickApprovalMode && loading && pendingApprovals.length === 0 && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {!isQuickApprovalMode && !loading && pendingApprovals.length === 0 && (
        <div className="card text-center py-16">
          <p className="text-gray-500 text-lg mb-2">Nessun contenuto in attesa di approvazione</p>
          <p className="text-gray-400 text-sm">Vai alla pagina News per raccogliere e generare nuovi contenuti</p>
          <button
            onClick={() => navigate('/news')}
            className="btn btn-primary mt-4"
          >
            📰 Vai a News
          </button>
        </div>
      )}

      {!isQuickApprovalMode && pendingApprovals.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending List */}
          <div className="space-y-3">
            <h2 className="font-bold text-gray-900">In attesa ({pendingApprovals.length})</h2>
            {pendingApprovals.map((approval) => (
              <div
                key={approval.newsId}
                onClick={() => {
                  setSelectedPost(approval);
                  setEditedContent({});
                  setPublishResult(null);
                }}
                className={`card cursor-pointer transition-colors ${
                  selectedPost?.newsId === approval.newsId ? 'bg-blue-50 border-blue-500' : ''
                }`}
              >
                <p className="font-medium text-gray-900 text-sm">{approval.title}</p>
                <p className="text-xs text-gray-500 mt-1">{approval.posts.length} piattaforme</p>
              </div>
            ))}
          </div>

          {/* Content Preview */}
          <div className="lg:col-span-2 space-y-6">
            {selectedPost && (
              <>
                <div className="card">
                  <h2 className="text-lg font-bold text-gray-900">{selectedPost.title}</h2>
                  {selectedPost.summary && (
                    <p className="text-gray-600 text-sm mt-2">{selectedPost.summary}</p>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900">Social Media Posts</h3>
                  {selectedPost.posts.map((post) => (
                    <PostPreview
                      key={post.platform}
                      post={post}
                      onEdit={(content) =>
                        setEditedContent({ ...editedContent, [post.platform]: content })
                      }
                    />
                  ))}
                </div>

                {selectedPost.blogPost && (
                  <div className="card">
                    <h3 className="font-bold text-gray-900 mb-3">Blog Post</h3>
                    <textarea
                      value={editedContent.blog || selectedPost.blogPost}
                      onChange={(e) => setEditedContent({ ...editedContent, blog: e.target.value })}
                      className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                    />
                  </div>
                )}

                <div className="card">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Programma pubblicazione (opzionale)
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleApprove}
                    disabled={loading}
                    className="flex-1 btn btn-success disabled:opacity-50"
                  >
                    {loading ? 'Pubblicazione...' : 'Approva & Pubblica'}
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={loading}
                    className="flex-1 btn btn-danger disabled:opacity-50"
                  >
                    Rifiuta
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Approval;
