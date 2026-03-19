import { useEffect, useState, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Eye, Clock, AlertCircle, LogIn, History, Filter, Users, User, Calendar, Square, CheckSquare, Loader2, MessageSquare, Newspaper, Trash2, X, ImageIcon } from 'lucide-react';
import { fetchFeedbacks, markFeedbackRead, type FeedbackItem, type FeedbackCategory } from '../api/tierLists';

interface Contribution {
  id: string;
  contributorId?: string;
  contributorName?: string;
  type: 'skin' | 'hero' | 'series' | 'counter';
  data: any;
  submittedAt?: string;
  createdAt?: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface HistoryEntry {
  id: string;
  type: 'skin' | 'hero' | 'series' | 'counter';
  action: 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt: string;
  data: any;
}

interface Contributor {
  id: string;
  name: string;
  email: string;
  totalContributions: number;
  totalTierLists: number;
  totalVotes: number;
}

type TypeFilter = 'all' | 'skin' | 'hero' | 'series' | 'counter';

export function AdminDashboard() {
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(localStorage.getItem('adminToken'));
  const [loginError, setLoginError] = useState('');
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showContributors, setShowContributors] = useState(false);
  const [showFeedbacks, setShowFeedbacks] = useState(false);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContribution, setSelectedContribution] = useState<Contribution | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('');
  const [showDevUpdates, setShowDevUpdates] = useState(false);
  const [devPosts, setDevPosts] = useState<{ id: number; title: string; content: string; tags: string[]; image_url: string | null; created_at: string }[]>([]);
  const [devForm, setDevForm] = useState({ title: '', content: '', tags: '' });
  const [devImageUrl, setDevImageUrl] = useState<string | null>(null);
  const [devImagePreview, setDevImagePreview] = useState<string | null>(null);
  const [devPosting, setDevPosting] = useState(false);
  const devImageRef = useRef<HTMLInputElement>(null);

  const API_BASE = import.meta.env.DEV ? '' : 'https://mlbbapi.project-n.site';

  useEffect(() => {
    if (token) {
      setIsAuthenticated(true);
      fetchAll();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchFeedbacksData = async () => {
    try {
      const data = await fetchFeedbacks(token!);
      setFeedbacks(data);
    } catch {
      // Silently fail
    }
  };

  const fetchAll = async () => {
    await Promise.all([fetchContributions(), fetchHistory(), fetchContributors(), fetchFeedbacksData()]);
    setLoading(false);
  };

  const handleLogin = async () => {
    setLoginError('');
    try {
      const response = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        localStorage.setItem('adminToken', data.token);
        setIsAuthenticated(true);
        setPassword('');
        fetchAll();
      } else {
        setLoginError('Password salah');
      }
    } catch (error) {
      setLoginError('Login gagal');
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
  };

  const fetchContributions = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/contributions/pending`);
      const data = await response.json();
      setContributions(data.contributions || []);
    } catch (error) {
      console.error('Failed to fetch contributions:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/contributions/history`);
      const data = await response.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const fetchContributors = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/contributors`);
      const data = await response.json();
      setContributors(data.contributors || []);
    } catch (error) {
      console.error('Failed to fetch contributors:', error);
    }
  };

  const handleApprove = async (contribution: Contribution) => {
    if (!confirm(`Setujui kontribusi ${contribution.id}?`)) return;

    try {
      const response = await fetch(`${API_BASE}/api/contributions/approve/${contribution.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('✅ Kontribusi disetujui!');
        fetchContributions();
        fetchHistory();
        queryClient.invalidateQueries({ queryKey: ['heroes'] });
      } else {
        const error = await response.json();
        alert(`Gagal: ${error.error || 'Kesalahan tidak diketahui'}`);
      }
    } catch (error) {
      alert('Kesalahan jaringan');
    }
  };

  const handleReject = async (contribution: Contribution) => {
    if (!confirm(`Tolak kontribusi ${contribution.id}?`)) return;

    try {
      const response = await fetch(`${API_BASE}/api/contributions/reject/${contribution.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('❌ Kontribusi ditolak');
        fetchContributions();
        fetchHistory();
      } else {
        const error = await response.json();
        alert(`Gagal: ${error.error || 'Kesalahan tidak diketahui'}`);
      }
    } catch (error) {
      alert('Kesalahan jaringan');
    }
  };

  const handleBulkApprove = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`Setujui ${ids.length} kontribusi?`)) return;

    setBulkLoading(true);
    setBulkStatus(`Menyetujui ${ids.length} kontribusi...`);
    try {
      const response = await fetch(`${API_BASE}/api/contributions/approve-bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ids })
      });
      const data = await response.json();
      if (response.ok) {
        const { approved, failed } = data.summary;
        setBulkStatus(`Selesai: ${approved} disetujui${failed > 0 ? `, ${failed} gagal` : ''}`);
        setSelectedIds(new Set());
        fetchContributions();
        fetchHistory();
        queryClient.invalidateQueries({ queryKey: ['heroes'] });
      } else {
        setBulkStatus(`Error: ${data.error || 'Kesalahan tidak diketahui'}`);
      }
    } catch {
      setBulkStatus('Kesalahan jaringan');
    } finally {
      setBulkLoading(false);
      setTimeout(() => setBulkStatus(''), 3000);
    }
  };

  const handleBulkReject = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`Tolak ${ids.length} kontribusi?`)) return;

    setBulkLoading(true);
    setBulkStatus(`Menolak ${ids.length} kontribusi...`);
    try {
      const response = await fetch(`${API_BASE}/api/contributions/reject-bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ids })
      });
      const data = await response.json();
      if (response.ok) {
        const { rejected, failed } = data.summary;
        setBulkStatus(`Selesai: ${rejected} ditolak${failed > 0 ? `, ${failed} gagal` : ''}`);
        setSelectedIds(new Set());
        fetchContributions();
        fetchHistory();
      } else {
        setBulkStatus(`Error: ${data.error || 'Kesalahan tidak diketahui'}`);
      }
    } catch {
      setBulkStatus('Kesalahan jaringan');
    } finally {
      setBulkLoading(false);
      setTimeout(() => setBulkStatus(''), 3000);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredContributions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredContributions.map(c => c.id)));
    }
  };

  // Stats calculations
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayHistory = history.filter(h => new Date(h.reviewedAt).toDateString() === today);

    return {
      pending: contributions.length,
      approvedToday: todayHistory.filter(h => h.action === 'approved').length,
      rejectedToday: todayHistory.filter(h => h.action === 'rejected').length,
      totalContributors: contributors.length,
      totalApproved: history.filter(h => h.action === 'approved').length,
      totalRejected: history.filter(h => h.action === 'rejected').length,
    };
  }, [contributions, history, contributors]);

  // Filtered contributions
  const filteredContributions = useMemo(() => {
    if (typeFilter === 'all') return contributions;
    return contributions.filter(c => c.type === typeFilter);
  }, [contributions, typeFilter]);

  const fetchDevPosts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setDevPosts(await res.json());
    } catch { /* silently fail */ }
  };

  const handleDevImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setDevImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    // Store file for upload
    (devImageRef.current as any)._file = file;
  };

  const handleCreateDevPost = async () => {
    if (!devForm.title.trim() || !devForm.content.trim()) return;
    setDevPosting(true);
    try {
      let imageUrl: string | null = devImageUrl;
      // Upload image if a new file was picked
      const file: File | undefined = (devImageRef.current as any)?._file;
      if (file && devImagePreview) {
        const base64 = devImagePreview.split(',')[1];
        const res = await fetch(`${API_BASE}/api/posts/upload-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ imageData: base64, mimeType: file.type }),
        });
        if (res.ok) {
          const data = await res.json();
          imageUrl = data.url;
        }
      }
      const tagsArr = devForm.tags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 5);
      const res = await fetch(`${API_BASE}/api/admin/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: devForm.title, content: devForm.content, tags: tagsArr, image_url: imageUrl }),
      });
      if (res.ok) {
        setDevForm({ title: '', content: '', tags: '' });
        setDevImagePreview(null);
        setDevImageUrl(null);
        if (devImageRef.current) { devImageRef.current.value = ''; (devImageRef.current as any)._file = undefined; }
        await fetchDevPosts();
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal membuat post');
      }
    } catch { alert('Network error'); }
    finally { setDevPosting(false); }
  };

  const handleDeleteDevPost = async (id: number) => {
    if (!confirm('Hapus dev update ini?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/posts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setDevPosts(prev => prev.filter(p => p.id !== id));
      else alert('Gagal menghapus post');
    } catch { alert('Network error'); }
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md mx-auto">
          <div className="card-hover p-8">
            <div className="flex items-center justify-center mb-6">
              <LogIn className="w-12 h-12 text-primary-400" />
            </div>
            <h1 className="text-3xl font-display font-bold mb-2 text-center">Admin Login</h1>
            <p className="text-gray-400 text-center mb-6">Masukkan password untuk mengakses admin dashboard</p>

            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-dark-50 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 text-white"
                placeholder="Masukkan password admin"
                autoFocus
              />

              {loginError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {loginError}
                </div>
              )}

              <button type="submit" className="w-full btn-primary" disabled={!password}>
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Tinjau dan kelola kontribusi komunitas</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setShowContributors(!showContributors); setShowHistory(false); setShowFeedbacks(false); }}
            className={`btn-secondary flex items-center gap-2 ${showContributors ? 'bg-primary-500/20' : ''}`}
          >
            <Users className="w-4 h-4" />
            Kontributor
          </button>
          <button
            onClick={() => { setShowHistory(!showHistory); setShowContributors(false); setShowFeedbacks(false); }}
            className={`btn-secondary flex items-center gap-2 ${showHistory ? 'bg-primary-500/20' : ''}`}
          >
            <History className="w-4 h-4" />
            Riwayat
          </button>
          <button
            onClick={() => { setShowDevUpdates(!showDevUpdates); setShowFeedbacks(false); setShowContributors(false); setShowHistory(false); if (!showDevUpdates) fetchDevPosts(); }}
            className={`btn-secondary flex items-center gap-2 ${showDevUpdates ? 'bg-primary-500/20' : ''}`}
          >
            <Newspaper className="w-4 h-4" />
            Dev Updates
          </button>
          <button
            onClick={() => { setShowFeedbacks(!showFeedbacks); setShowContributors(false); setShowHistory(false); setShowDevUpdates(false); if (!showFeedbacks) fetchFeedbacksData(); }}
            className={`btn-secondary flex items-center gap-2 ${showFeedbacks ? 'bg-primary-500/20' : ''}`}
          >
            <MessageSquare className="w-4 h-4" />
            Feedbacks
            {feedbacks.filter(f => !f.is_read).length > 0 && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {feedbacks.filter(f => !f.is_read).length}
              </span>
            )}
          </button>
          <button onClick={handleLogout} className="btn-secondary">
            Logout
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="card-hover p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-orange-400" />
            <div>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <div className="text-xs text-gray-400">Pending</div>
            </div>
          </div>
        </div>
        <div className="card-hover p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <div>
              <div className="text-2xl font-bold">{stats.approvedToday}</div>
              <div className="text-xs text-gray-400">Disetujui Hari Ini</div>
            </div>
          </div>
        </div>
        <div className="card-hover p-4">
          <div className="flex items-center gap-3">
            <XCircle className="w-6 h-6 text-red-400" />
            <div>
              <div className="text-2xl font-bold">{stats.rejectedToday}</div>
              <div className="text-xs text-gray-400">Ditolak Hari Ini</div>
            </div>
          </div>
        </div>
        <div className="card-hover p-4">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-400" />
            <div>
              <div className="text-2xl font-bold">{stats.totalContributors}</div>
              <div className="text-xs text-gray-400">Kontributor</div>
            </div>
          </div>
        </div>
        <div className="card-hover p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-400/50" />
            <div>
              <div className="text-2xl font-bold">{stats.totalApproved}</div>
              <div className="text-xs text-gray-400">Total Disetujui</div>
            </div>
          </div>
        </div>
        <div className="card-hover p-4">
          <div className="flex items-center gap-3">
            <XCircle className="w-6 h-6 text-red-400/50" />
            <div>
              <div className="text-2xl font-bold">{stats.totalRejected}</div>
              <div className="text-xs text-gray-400">Total Ditolak</div>
            </div>
          </div>
        </div>
      </div>

      {/* Contributors View */}
      {showContributors && (
        <div className="card-hover p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-400" />
            Semua Kontributor ({contributors.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-gray-400 text-sm">Nama</th>
                  <th className="text-left py-3 px-4 text-gray-400 text-sm">Email</th>
                  <th className="text-center py-3 px-4 text-gray-400 text-sm">Kontribusi</th>
                  <th className="text-center py-3 px-4 text-gray-400 text-sm">Tier Lists</th>
                  <th className="text-center py-3 px-4 text-gray-400 text-sm">Votes</th>
                </tr>
              </thead>
              <tbody>
                {contributors.map((c) => (
                  <tr key={c.id} className="border-b border-white/5 hover:bg-dark-50">
                    <td className="py-3 px-4 font-medium">{c.name}</td>
                    <td className="py-3 px-4 text-gray-400">{c.email}</td>
                    <td className="py-3 px-4 text-center">{c.totalContributions}</td>
                    <td className="py-3 px-4 text-center">{c.totalTierLists}</td>
                    <td className="py-3 px-4 text-center">{c.totalVotes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* History View */}
      {showHistory && (
        <div className="card-hover p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <History className="w-6 h-6 text-purple-400" />
            Riwayat Kontribusi
          </h2>
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-400">Belum ada riwayat</div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {history.map((entry) => (
                <div key={entry.id} className="p-4 bg-dark-50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {entry.action === 'approved' ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    <div>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        entry.type === 'skin' ? 'bg-green-500/20 text-green-400' :
                        entry.type === 'hero' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>
                        {entry.type}
                      </span>
                      <span className="ml-2 text-sm">{new Date(entry.reviewedAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">ID: {entry.id}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Feedbacks View */}
      {showFeedbacks && (
        <div className="card-hover p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary-400" />
            Kritik & Saran ({feedbacks.length})
            {feedbacks.filter(f => !f.is_read).length > 0 && (
              <span className="text-sm font-normal text-gray-400">
                · {feedbacks.filter(f => !f.is_read).length} belum dibaca
              </span>
            )}
          </h2>
          {feedbacks.length === 0 ? (
            <div className="text-center py-8 text-gray-400">Belum ada feedback</div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {feedbacks.map((fb) => {
                const categoryConfig: Record<FeedbackCategory, { label: string; color: string; bg: string }> = {
                  bug: { label: '🐛 Bug', color: 'text-red-400', bg: 'bg-red-500/10' },
                  feature: { label: '✨ Fitur Baru', color: 'text-blue-400', bg: 'bg-blue-500/10' },
                  suggestion: { label: '💡 Saran', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
                  criticism: { label: '📝 Kritik', color: 'text-orange-400', bg: 'bg-orange-500/10' },
                  compliment: { label: '❤️ Pujian', color: 'text-pink-400', bg: 'bg-pink-500/10' },
                  other: { label: '💬 Lainnya', color: 'text-gray-400', bg: 'bg-gray-500/10' },
                };
                const cat = categoryConfig[fb.category] || categoryConfig.other;
                return (
                  <div
                    key={fb.id}
                    className={`p-4 rounded-lg border ${fb.is_read ? 'border-white/5 bg-dark-50' : 'border-primary-500/30 bg-primary-500/5'}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${cat.bg} ${cat.color}`}>
                            {cat.label}
                          </span>
                          {!fb.is_read && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary-500/20 text-primary-400">
                              Baru
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {new Date(fb.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-white mb-1">
                          {fb.name || 'Anonymous'}
                        </p>
                        <p className="text-sm text-gray-300 whitespace-pre-wrap">{fb.message}</p>
                      </div>
                      {!fb.is_read && (
                        <button
                          onClick={async () => {
                            await markFeedbackRead(fb.id, token!);
                            setFeedbacks(prev => prev.map(f => f.id === fb.id ? { ...f, is_read: true } : f));
                          }}
                          className="shrink-0 text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/20 px-2 py-1 rounded transition-colors"
                        >
                          Tandai dibaca
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Dev Updates Panel */}
      {showDevUpdates && (
        <div className="card-hover p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-primary-400" />
            Dev Updates
          </h2>

          {/* Create Form */}
          <div className="bg-dark-50 rounded-lg p-5 mb-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-200">Post Baru</h3>
            <input
              type="text"
              placeholder="Judul update..."
              value={devForm.title}
              onChange={e => setDevForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-4 py-2.5 bg-dark-300 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 text-white text-sm"
            />
            <textarea
              placeholder="Isi update (mendukung markdown sederhana)..."
              value={devForm.content}
              onChange={e => setDevForm(f => ({ ...f, content: e.target.value }))}
              rows={5}
              className="w-full px-4 py-2.5 bg-dark-300 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 text-white text-sm resize-y"
            />
            <input
              type="text"
              placeholder="Tags (pisahkan dengan koma, maks 5)..."
              value={devForm.tags}
              onChange={e => setDevForm(f => ({ ...f, tags: e.target.value }))}
              className="w-full px-4 py-2.5 bg-dark-300 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 text-white text-sm"
            />

            {/* Image picker */}
            <div>
              {devImagePreview ? (
                <div className="relative inline-block">
                  <img src={devImagePreview} alt="preview" className="max-h-40 rounded-lg border border-white/10" />
                  <button
                    onClick={() => { setDevImagePreview(null); setDevImageUrl(null); if (devImageRef.current) { devImageRef.current.value = ''; (devImageRef.current as any)._file = undefined; } }}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => devImageRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 border border-white/10 hover:border-white/30 rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <ImageIcon className="w-4 h-4" />
                  Tambah Gambar
                </button>
              )}
              <input ref={devImageRef} type="file" accept="image/*" className="hidden" onChange={handleDevImagePick} />
            </div>

            <button
              onClick={handleCreateDevPost}
              disabled={devPosting || !devForm.title.trim() || !devForm.content.trim()}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {devPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Newspaper className="w-4 h-4" />}
              {devPosting ? 'Memposting...' : 'Post Dev Update'}
            </button>
          </div>

          {/* Existing Dev Posts */}
          <h3 className="text-lg font-semibold text-gray-200 mb-3">Post Tersimpan ({devPosts.length})</h3>
          {devPosts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">Belum ada dev update</div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {devPosts.map(post => (
                <div key={post.id} className="p-4 bg-dark-50 rounded-lg flex items-start gap-4">
                  {post.image_url && (
                    <img src={`https://mlbbapi.project-n.site${post.image_url}`} alt="" className="w-20 h-16 object-cover rounded-lg shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white mb-1 truncate">{post.title}</div>
                    <p className="text-sm text-gray-400 line-clamp-2">{post.content}</p>
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {post.tags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-primary-500/20 text-primary-400 text-xs rounded-full">{tag}</span>
                        ))}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">{new Date(post.created_at).toLocaleString('id-ID')}</div>
                  </div>
                  <button
                    onClick={() => handleDeleteDevPost(post.id)}
                    className="shrink-0 p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contributions - Filter + List */}
      {!showHistory && !showContributors && !showFeedbacks && !showDevUpdates && (
        <>
          {/* Filter + Bulk Actions */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-400">Filter:</span>
            {(['all', 'skin', 'hero', 'series', 'counter'] as TypeFilter[]).map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  typeFilter === type
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-50 text-gray-400 hover:text-white'
                }`}
              >
                {type === 'all' ? 'Semua' : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}

            {/* Bulk controls */}
            {filteredContributions.length > 0 && (
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-dark-50 text-gray-400 hover:text-white transition-colors"
                >
                  {selectedIds.size === filteredContributions.length && filteredContributions.length > 0
                    ? <CheckSquare className="w-4 h-4 text-primary-400" />
                    : <Square className="w-4 h-4" />}
                  {selectedIds.size === filteredContributions.length && filteredContributions.length > 0
                    ? 'Batalkan Semua'
                    : 'Pilih Semua'}
                </button>

                {selectedIds.size > 0 && (
                  <>
                    <span className="text-sm text-gray-400">{selectedIds.size} dipilih</span>
                    <button
                      onClick={handleBulkApprove}
                      disabled={bulkLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-green-500/20 hover:bg-green-500/30 text-green-400 disabled:opacity-50 transition-colors"
                    >
                      {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Setujui ({selectedIds.size})
                    </button>
                    <button
                      onClick={handleBulkReject}
                      disabled={bulkLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 disabled:opacity-50 transition-colors"
                    >
                      {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      Tolak ({selectedIds.size})
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Bulk status message */}
          {bulkStatus && (
            <div className="mb-4 px-4 py-2 bg-dark-50 rounded-lg text-sm text-gray-300 flex items-center gap-2">
              {bulkLoading && <Loader2 className="w-4 h-4 animate-spin text-primary-400" />}
              {bulkStatus}
            </div>
          )}

          {/* List */}
          {filteredContributions.length === 0 ? (
            <div className="card-hover p-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Tidak ada kontribusi pending</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredContributions.map((contribution) => (
                <div
                  key={contribution.id}
                  className={`card-hover p-6 hover:border-primary-500/30 transition-colors ${selectedIds.has(contribution.id) ? 'border-primary-500/40 bg-primary-500/5' : ''}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleSelect(contribution.id)}
                      className="mt-1 flex-shrink-0 text-gray-500 hover:text-primary-400 transition-colors"
                    >
                      {selectedIds.has(contribution.id)
                        ? <CheckSquare className="w-5 h-5 text-primary-400" />
                        : <Square className="w-5 h-5" />}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          contribution.type === 'skin' ? 'bg-green-500/20 text-green-400' :
                          contribution.type === 'hero' ? 'bg-blue-500/20 text-blue-400' :
                          contribution.type === 'counter' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-purple-500/20 text-purple-400'
                        }`}>
                          {contribution.type.toUpperCase()}
                        </span>
                        {contribution.contributorName && (
                          <span className="flex items-center gap-1 text-sm text-gray-400">
                            <User className="w-3 h-3" />
                            {contribution.contributorName}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {new Date(contribution.submittedAt || contribution.createdAt || '').toLocaleString()}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold mb-1">
                        {contribution.type === 'skin'
                          ? `${contribution.data.skin?.skinName} (${contribution.data.heroName})`
                          : contribution.type === 'hero'
                          ? contribution.data.name
                          : contribution.type === 'counter'
                          ? `${contribution.data.action === 'add' ? 'Tambah' : 'Hapus'} ${contribution.data.targetHeroName} ${contribution.data.relationshipType === 'strongAgainst' ? 'ke Kuat Melawan' : contribution.data.relationshipType === 'weakAgainst' ? 'ke Lemah Melawan' : 'ke Partner Terbaik'} untuk ${contribution.data.heroName}`
                          : contribution.data.seriesName}
                      </h3>
                      <div className="text-xs text-gray-500">ID: {contribution.id}</div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedContribution(contribution)}
                        className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors"
                        title="Preview"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleApprove(contribution)}
                        className="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-colors"
                        title="Setujui"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleReject(contribution)}
                        className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                        title="Tolak"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Preview Modal */}
      {selectedContribution && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
          onClick={() => setSelectedContribution(null)}
        >
          <div
            className="bg-dark-300 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Pratinjau Kontribusi</h2>
              <button
                onClick={() => setSelectedContribution(null)}
                className="p-2 hover:bg-dark-200 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Jenis</label>
                  <div className="text-lg font-semibold">{selectedContribution.type.toUpperCase()}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Kontributor</label>
                  <div className="text-lg">{selectedContribution.contributorName || 'Anonymous'}</div>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400">Dikirim Pada</label>
                <div>{new Date(selectedContribution.submittedAt || selectedContribution.createdAt || '').toLocaleString()}</div>
              </div>

              {selectedContribution.type === 'counter' ? (
                <div className="space-y-3">
                  <div className="p-4 bg-dark-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-500">Hero</label>
                        <div className="font-semibold">{selectedContribution.data.heroName}</div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Aksi</label>
                        <div className={`font-semibold ${selectedContribution.data.action === 'add' ? 'text-green-400' : 'text-red-400'}`}>
                          {selectedContribution.data.action === 'add' ? 'TAMBAH' : 'HAPUS'}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Hubungan</label>
                        <div className="font-semibold">
                          {selectedContribution.data.relationshipType === 'strongAgainst' ? 'Kuat Melawan' :
                           selectedContribution.data.relationshipType === 'weakAgainst' ? 'Lemah Melawan' : 'Partner Terbaik'}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Hero Target</label>
                        <div className="flex items-center gap-2">
                          {selectedContribution.data.targetHeroIcon && (
                            <img src={selectedContribution.data.targetHeroIcon} alt="" className="w-6 h-6 rounded" />
                          )}
                          <span className="font-semibold">{selectedContribution.data.targetHeroName}</span>
                        </div>
                      </div>
                    </div>
                    {selectedContribution.data.description && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <label className="text-xs text-gray-500">Alasan</label>
                        <div className="text-sm text-gray-300">{selectedContribution.data.description}</div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-sm text-gray-400">Data (JSON)</label>
                  <pre className="mt-2 p-4 bg-dark-50 rounded-lg text-sm overflow-x-auto">
                    {JSON.stringify(selectedContribution.data, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={() => { handleApprove(selectedContribution); setSelectedContribution(null); }}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Setujui
                </button>
                <button
                  onClick={() => { handleReject(selectedContribution); setSelectedContribution(null); }}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  Tolak
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
