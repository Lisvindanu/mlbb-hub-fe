import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from '@tanstack/react-router';
import {
  fetchPosts, createPost, deletePost, toggleLike, uploadImage,
  fetchReplies, createReply, deleteReply, updateReply, updatePost,
  type Post, type PostType, type Reply,
} from '../api/community';

// ─── helpers ─────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.DEV ? '' : 'https://mlbbapi.project-n.site';

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}h lalu`;
  return new Date(iso).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
}

const TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
  dev:        { label: 'Dev Update',  color: '#fcd34d', bg: 'rgba(120,90,10,0.35)' },
  build:      { label: 'Build',       color: '#60a5fa', bg: 'rgba(30,60,120,0.35)' },
  strategy:   { label: 'Strategy',    color: '#34d399', bg: 'rgba(10,80,50,0.35)' },
  discussion: { label: 'Discussion',  color: '#a78bfa', bg: 'rgba(60,30,100,0.35)' },
};

const TABS: { key: string; label: string }[] = [
  { key: 'all',        label: 'Semua' },
  { key: 'dev',        label: 'Dev Updates' },
  { key: 'build',      label: 'Build' },
  { key: 'strategy',   label: 'Strategy' },
  { key: 'discussion', label: 'Discussion' },
];

function initials(name: string | null) {
  if (!name) return '?';
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
const MAX_FILE_MB = 6;

// ─── LoginPrompt ──────────────────────────────────────────────────────────────

function LoginPrompt({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="w-full max-w-sm rounded-2xl border border-white/10 p-6 text-center"
        style={{ background: 'linear-gradient(135deg, #0d1f35, #101c2e)' }}
      >
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"
          style={{ background: 'rgba(29,127,212,0.2)', border: '1px solid rgba(29,127,212,0.4)' }}>
          ✍️
        </div>
        <h3 className="text-white font-semibold text-lg mb-1">Login dulu yuk!</h3>
        <p className="text-white/50 text-sm mb-5">Kamu perlu login untuk bikin post di Community Board.</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl text-sm text-white/50 border border-white/10 hover:text-white transition-colors"
          >
            Nanti aja
          </button>
          <button
            onClick={() => navigate({ to: '/auth' })}
            className="flex-1 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors"
          >
            Login / Daftar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── NewPostModal ─────────────────────────────────────────────────────────────

function NewPostModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState<PostType>('discussion');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError('');
    if (!ALLOWED_TYPES.includes(file.type)) {
      setImageError('Tipe file tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.');
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setImageError(`Ukuran file maksimal ${MAX_FILE_MB}MB.`);
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    setImageError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function addTag(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const t = tagInput.trim().replace(/^#/, '');
      if (t && !tags.includes(t) && tags.length < 5) {
        setTags([...tags, t]);
        setTagInput('');
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (!title.trim() || !content.trim()) { setError('Judul dan konten wajib diisi.'); return; }
    setSubmitting(true);
    setError('');

    let imageUrl: string | null = null;

    // Upload image first if selected
    if (imageFile && imagePreview) {
      setUploadingImage(true);
      try {
        const result = await uploadImage(imagePreview, imageFile.type, token);
        imageUrl = result.url;
      } catch (err: any) {
        setError(err.message || 'Gagal upload gambar.');
        setSubmitting(false);
        setUploadingImage(false);
        return;
      }
      setUploadingImage(false);
    }

    try {
      const validTypes: PostType[] = ['build', 'strategy', 'discussion', 'dev'];
      const postType = validTypes.includes(type) ? type : 'discussion';
      await createPost({ type: postType, title: title.trim(), content: content.trim(), tags, image_url: imageUrl }, token);
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal membuat post.');
    } finally {
      setSubmitting(false);
    }
  }

  const typeList: { value: PostType; label: string }[] = [
    { value: 'discussion', label: 'Discussion' },
    { value: 'build',      label: 'Build' },
    { value: 'strategy',   label: 'Strategy' },
  ];

  const isLoading = submitting || uploadingImage;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', overflowY: 'auto' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl rounded-2xl border border-white/10 p-6"
        style={{ background: 'linear-gradient(135deg, #0d1f35, #101c2e)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white">Buat Post Baru</h2>
          <button onClick={onClose} disabled={isLoading} className="text-white/40 hover:text-white transition-colors text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type selector */}
          <div className="flex gap-2 flex-wrap">
            {typeList.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-all border"
                style={
                  type === t.value
                    ? { background: TYPE_META[t.value].bg, color: TYPE_META[t.value].color, borderColor: TYPE_META[t.value].color + '80' }
                    : { background: 'transparent', color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.12)' }
                }
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Judul post..."
            maxLength={120}
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 text-sm"
          />

          {/* Content */}
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Tulis konten post kamu..."
            rows={5}
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 text-sm resize-none"
          />

          {/* Image upload */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_TYPES.join(',')}
              className="hidden"
              onChange={handleFileChange}
            />
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-white/10">
                <img src={imagePreview} alt="preview" className="w-full max-h-64 object-cover" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                >
                  ×
                </button>
                {uploadingImage && (
                  <div className="absolute inset-0 flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}>
                    <div className="flex items-center gap-2 text-white text-sm">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      <span>Mengupload gambar...</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 rounded-xl border border-dashed border-white/15 text-white/35 text-sm hover:border-blue-500/40 hover:text-blue-400/70 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 20.25h18M16.5 3.75h.008v.008H16.5V3.75z" />
                </svg>
                Tambah gambar (opsional, maks {MAX_FILE_MB}MB)
              </button>
            )}
            {imageError && <p className="mt-1 text-red-400 text-xs">{imageError}</p>}
          </div>

          {/* Tags */}
          <div>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {tags.map(t => (
                <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-900/40 text-blue-300 border border-blue-500/30">
                  #{t}
                  <button type="button" onClick={() => setTags(tags.filter(x => x !== t))} className="text-blue-400/60 hover:text-blue-300">×</button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={addTag}
              placeholder="Tambah tag (tekan Enter)..."
              className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 text-sm"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2 rounded-xl text-sm text-white/50 hover:text-white transition-colors border border-white/10 disabled:opacity-40"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading && <div className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />}
              {uploadingImage ? 'Mengupload...' : submitting ? 'Memposting...' : 'Post'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── EditPostModal ────────────────────────────────────────────────────────────

function EditPostModal({ post, onClose, onUpdated }: { post: Post; onClose: () => void; onUpdated: (p: Post) => void }) {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(post.tags);

  const [imagePreview, setImagePreview] = useState<string | null>(
    post.image_url ? `${API_BASE}${post.image_url}` : null
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError('');
    if (!ALLOWED_TYPES.includes(file.type)) { setImageError('Tipe file tidak didukung.'); return; }
    if (file.size > MAX_FILE_MB * 1024 * 1024) { setImageError(`Maksimal ${MAX_FILE_MB}MB.`); return; }
    setImageFile(file);
    setRemoveImage(false);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function addTag(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const t = tagInput.trim().replace(/^#/, '');
      if (t && !tags.includes(t) && tags.length < 5) { setTags([...tags, t]); setTagInput(''); }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (!title.trim() || !content.trim()) { setError('Judul dan konten wajib diisi.'); return; }
    setSubmitting(true);
    setError('');

    let imageUrl: string | null | undefined = undefined; // undefined = no change

    if (imageFile && imagePreview?.startsWith('data:')) {
      setUploadingImage(true);
      try {
        const result = await uploadImage(imagePreview, imageFile.type, token);
        imageUrl = result.url;
      } catch (err: any) {
        setError(err.message || 'Gagal upload gambar.');
        setSubmitting(false);
        setUploadingImage(false);
        return;
      }
      setUploadingImage(false);
    } else if (removeImage) {
      imageUrl = null; // explicitly remove
    }

    try {
      const payload: Record<string, unknown> = { title: title.trim(), content: content.trim(), tags };
      if (imageUrl !== undefined) payload.image_url = imageUrl;
      const updated = await updatePost(post.id, payload, token);
      onUpdated(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan post.');
    } finally {
      setSubmitting(false);
    }
  }

  const isLoading = submitting || uploadingImage;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', overflowY: 'auto' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl rounded-2xl border border-white/10 p-6"
        style={{ background: 'linear-gradient(135deg, #0d1f35, #101c2e)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white">Edit Post</h2>
          <button onClick={onClose} disabled={isLoading} className="text-white/40 hover:text-white transition-colors text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Judul post..."
            maxLength={120}
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 text-sm"
          />
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Konten post..."
            rows={5}
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 text-sm resize-none"
          />

          {/* Image */}
          <div>
            <input ref={fileInputRef} type="file" accept={ALLOWED_TYPES.join(',')} className="hidden" onChange={handleFileChange} />
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-white/10">
                <img src={imagePreview} alt="preview" className="w-full max-h-48 object-cover" />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: 'rgba(0,0,0,0.6)' }}
                >×</button>
                {uploadingImage && (
                  <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
                    <div className="flex items-center gap-2 text-white text-sm">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      <span>Mengupload...</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 rounded-xl border border-dashed border-white/15 text-white/35 text-sm hover:border-blue-500/40 hover:text-blue-400/70 transition-colors"
              >
                + Tambah gambar (opsional)
              </button>
            )}
            {imageError && <p className="mt-1 text-red-400 text-xs">{imageError}</p>}
          </div>

          {/* Tags */}
          <div>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {tags.map(t => (
                <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-900/40 text-blue-300 border border-blue-500/30">
                  #{t}
                  <button type="button" onClick={() => setTags(tags.filter(x => x !== t))} className="text-blue-400/60 hover:text-blue-300">×</button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={addTag}
              placeholder="Tambah tag (tekan Enter)..."
              className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 text-sm"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} disabled={isLoading} className="px-5 py-2 rounded-xl text-sm text-white/50 hover:text-white border border-white/10 disabled:opacity-40 transition-colors">
              Batal
            </button>
            <button type="submit" disabled={isLoading} className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 flex items-center gap-2 transition-colors">
              {isLoading && <div className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />}
              {uploadingImage ? 'Mengupload...' : submitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── PostCard ─────────────────────────────────────────────────────────────────

function PostCard({
  post,
  onLike,
  onDelete,
  onEdit,
  currentUserId,
  token,
  isAuthenticated,
  onLoginPrompt,
}: {
  post: Post;
  onLike: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (post: Post) => void;
  currentUserId: string | null;
  token: string | null;
  isAuthenticated: boolean;
  onLoginPrompt: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [imgExpanded, setImgExpanded] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [repliesLoaded, setRepliesLoaded] = useState(false);
  const [replyInput, setReplyInput] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replyCount, setReplyCount] = useState(post.reply_count ?? 0);
  const [editingReplyId, setEditingReplyId] = useState<number | null>(null);
  const [editInput, setEditInput] = useState('');

  const meta = TYPE_META[post.type] ?? TYPE_META.discussion;
  const isOwn = currentUserId && post.author_id !== null && String(post.author_id) === currentUserId;
  const imageUrl = post.image_url ? `${API_BASE}${post.image_url}` : null;

  async function handleToggleReplies() {
    if (!showReplies && !repliesLoaded) {
      try {
        const data = await fetchReplies(post.id);
        setReplies(data);
        setReplyCount(data.length);
        setRepliesLoaded(true);
      } catch { /* ignore */ }
    }
    setShowReplies(prev => !prev);
  }

  async function handleSubmitReply(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !replyInput.trim()) return;
    setSubmittingReply(true);
    try {
      const reply = await createReply(post.id, replyInput.trim(), token);
      setReplies(prev => [...prev, reply]);
      setReplyCount(prev => prev + 1);
      setReplyInput('');
    } catch { /* ignore */ }
    finally { setSubmittingReply(false); }
  }

  async function handleDeleteReply(replyId: number) {
    if (!token || !window.confirm('Hapus reply ini?')) return;
    try {
      await deleteReply(post.id, replyId, token);
      setReplies(prev => prev.filter(r => r.id !== replyId));
      setReplyCount(prev => Math.max(prev - 1, 0));
    } catch { /* ignore */ }
  }

  function startEditReply(reply: Reply) {
    setEditingReplyId(reply.id);
    setEditInput(reply.content);
  }

  async function handleSaveEdit(replyId: number) {
    if (!token || !editInput.trim()) return;
    try {
      const updated = await updateReply(post.id, replyId, editInput.trim(), token);
      setReplies(prev => prev.map(r => r.id === replyId ? { ...r, content: updated.content } : r));
      setEditingReplyId(null);
    } catch { /* ignore */ }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border overflow-hidden"
      style={{
        background: post.is_dev
          ? 'linear-gradient(135deg, rgba(18,14,5,0.95), rgba(25,18,4,0.95))'
          : 'linear-gradient(135deg, rgba(10,20,38,0.95), rgba(8,16,30,0.95))',
        borderColor: post.is_dev ? 'rgba(252,211,77,0.2)' : post.is_pinned ? 'rgba(96,165,250,0.2)' : 'rgba(255,255,255,0.06)',
      }}
    >
      {/* Dev update banner */}
      {post.is_dev && (
        <div className="px-5 py-1.5 flex items-center gap-2 border-b border-yellow-500/20"
          style={{ background: 'rgba(120,90,10,0.25)' }}>
          <span className="text-yellow-400 text-xs">★</span>
          <span className="text-yellow-400 text-xs font-semibold tracking-wide uppercase">Dev Update</span>
        </div>
      )}
      {/* Pinned banner */}
      {post.is_pinned && !post.is_dev && (
        <div className="px-5 py-1 flex items-center gap-2 border-b border-blue-500/20"
          style={{ background: 'rgba(30,60,120,0.25)' }}>
          <span className="text-blue-300 text-xs">📌</span>
          <span className="text-blue-300 text-xs font-medium">Pinned</span>
        </div>
      )}

      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border border-white/10"
            style={{ background: 'rgba(40,60,100,0.6)', color: '#93c5fd' }}
          >
            {initials(post.author_name)}
          </div>

          <div className="flex-1 min-w-0">
            {/* Author + meta row */}
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <span className="text-white/70 text-sm font-medium">{post.author_name ?? 'MLBB Hub'}</span>
              <span className="text-white/25 text-xs">·</span>
              <span className="text-white/35 text-xs">{timeAgo(post.created_at)}</span>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ color: meta.color, background: meta.bg }}
              >
                {meta.label}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-white font-semibold text-base leading-snug mb-2">{post.title}</h3>

            {/* Content */}
            <div
              className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap"
              style={{ maxHeight: expanded ? 'none' : '4.5rem', overflow: 'hidden' }}
            >
              {post.content}
            </div>
            {post.content.length > 200 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-1 text-blue-400 text-xs hover:text-blue-300 transition-colors"
              >
                {expanded ? 'Sembunyikan' : 'Baca selengkapnya'}
              </button>
            )}

            {/* Image */}
            {imageUrl && (
              <div className="mt-3">
                <img
                  src={imageUrl}
                  alt="post image"
                  className="rounded-xl max-h-72 w-full object-cover cursor-pointer transition-opacity hover:opacity-90"
                  onClick={() => setImgExpanded(true)}
                />
              </div>
            )}

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {post.tags.map(t => (
                  <span key={t} className="px-2 py-0.5 rounded-full text-xs bg-blue-900/30 text-blue-300/70 border border-blue-500/20">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/5">
          <button
            onClick={() => onLike(post.id)}
            className="flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: post.liked ? '#f87171' : 'rgba(255,255,255,0.35)' }}
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill={post.liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
            </svg>
            <span>{post.likes}</span>
          </button>

          <button
            onClick={handleToggleReplies}
            className="flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: showReplies ? 'rgba(147,197,253,0.8)' : 'rgba(255,255,255,0.35)' }}
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v7a2 2 0 01-2 2H6l-4 4V5z" />
            </svg>
            <span>{replyCount > 0 ? replyCount : ''} {replyCount === 1 ? 'Balasan' : replyCount > 1 ? 'Balasan' : 'Balas'}</span>
          </button>

          <div className="flex-1" />
          {isOwn && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit(post)}
                className="text-xs text-white/30 hover:text-blue-400 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(post.id)}
                className="text-xs text-white/30 hover:text-red-400 transition-colors"
              >
                Hapus
              </button>
            </div>
          )}
        </div>

        {/* Replies section */}
        <AnimatePresence>
          {showReplies && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                {replies.length === 0 && repliesLoaded && (
                  <p className="text-white/25 text-xs text-center py-2">Belum ada reply. Jadilah yang pertama!</p>
                )}
                {replies.map(reply => {
                  const isOwner = currentUserId && reply.author_id !== null && String(reply.author_id) === currentUserId;
                  const isEditing = editingReplyId === reply.id;
                  return (
                    <div key={reply.id} className="flex items-start gap-2.5">
                      <div
                        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border border-white/10"
                        style={{ background: 'rgba(30,50,80,0.6)', color: '#93c5fd' }}
                      >
                        {initials(reply.author_name)}
                      </div>
                      <div className="flex-1 min-w-0 rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white/65 text-xs font-medium">{reply.author_name ?? 'Anonymous'}</span>
                          <span className="text-white/25 text-xs">·</span>
                          <span className="text-white/30 text-xs">{timeAgo(reply.created_at)}</span>
                          {isOwner && !isEditing && (
                            <div className="ml-auto flex items-center gap-1.5">
                              <button
                                onClick={() => startEditReply(reply)}
                                className="text-xs text-white/35 hover:text-blue-400 transition-colors px-1.5 py-0.5 rounded hover:bg-blue-500/10"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteReply(reply.id)}
                                className="text-xs text-white/35 hover:text-red-400 transition-colors px-1.5 py-0.5 rounded hover:bg-red-500/10"
                              >
                                Hapus
                              </button>
                            </div>
                          )}
                        </div>
                        {isEditing ? (
                          <div className="flex flex-col gap-1.5">
                            <textarea
                              value={editInput}
                              onChange={e => setEditInput(e.target.value)}
                              maxLength={500}
                              rows={2}
                              autoFocus
                              className="w-full px-2 py-1.5 rounded-lg text-sm text-white border border-blue-500/40 focus:outline-none resize-none"
                              style={{ background: 'rgba(255,255,255,0.07)' }}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveEdit(reply.id)}
                                disabled={!editInput.trim()}
                                className="px-3 py-1 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 transition-colors"
                              >
                                Simpan
                              </button>
                              <button
                                onClick={() => setEditingReplyId(null)}
                                className="px-3 py-1 rounded-lg text-xs text-white/40 hover:text-white border border-white/10 transition-colors"
                              >
                                Batal
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-white/55 text-sm leading-relaxed">{reply.content}</p>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Reply input */}
                {isAuthenticated ? (
                  <form onSubmit={handleSubmitReply} className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={replyInput}
                      onChange={e => setReplyInput(e.target.value)}
                      placeholder="Tulis reply..."
                      maxLength={500}
                      className="flex-1 px-3 py-1.5 rounded-xl text-sm text-white placeholder-white/25 border border-white/10 focus:outline-none focus:border-blue-500/40"
                      style={{ background: 'rgba(255,255,255,0.05)' }}
                    />
                    <button
                      type="submit"
                      disabled={submittingReply || !replyInput.trim()}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 transition-colors"
                    >
                      {submittingReply ? '...' : 'Kirim'}
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={onLoginPrompt}
                    className="text-xs text-blue-400/70 hover:text-blue-400 transition-colors"
                  >
                    Login untuk reply →
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fullscreen image lightbox */}
      <AnimatePresence>
        {imgExpanded && imageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.92)' }}
            onClick={() => setImgExpanded(false)}
          >
            <img
              src={imageUrl}
              alt="full"
              className="max-w-full max-h-full rounded-xl object-contain"
              onClick={e => e.stopPropagation()}
            />
            <button
              className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-white text-xl"
              style={{ background: 'rgba(0,0,0,0.5)' }}
              onClick={() => setImgExpanded(false)}
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── CommunityPage ────────────────────────────────────────────────────────────

export function CommunityPage() {
  useEffect(() => {
    document.title = 'Community - Mobile Legends: Bang Bang | MLBB Hub';
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', 'MLBB Hub community hub. Read dev updates, share builds, and discuss Mobile Legends: Bang Bang strategies.');
    return () => { document.title = 'MLBB Hub - Mobile Legends: Bang Bang Community Hub'; };
  }, []);

  const { isAuthenticated, token, contributorId } = useAuth();

  const [activeTab, setActiveTab] = useState('all');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPosts({ type: activeTab }, token ?? undefined);
      setPosts(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [activeTab, token]);

  useEffect(() => { load(); }, [load]);

  async function handleLike(id: number) {
    const result = await toggleLike(id, token ?? undefined);
    setPosts(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, liked: result.liked, likes: result.liked ? p.likes + 1 : Math.max(p.likes - 1, 0) }
          : p
      )
    );
  }

  async function handleDelete(id: number) {
    if (!token) return;
    if (!window.confirm('Hapus post ini?')) return;
    try {
      await deletePost(id, token);
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch {/* ignore */}
  }

  function handleUpdated(updated: Post) {
    setPosts(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
  }

  function handleNewPostClick() {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
    } else {
      setShowNewPost(true);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #070f1d, #091828 60%, #07111e)' }}>
      {/* Hero header */}
      <div
        className="relative border-b border-white/5 px-6 py-10 text-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(10,25,55,0.8), rgba(5,15,35,0.9))' }}
      >
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #1d7fd4 0%, transparent 70%)' }} />
        <h1 className="relative text-3xl font-bold text-white tracking-tight">Community Board</h1>
        <p className="relative text-white/45 mt-1 text-sm max-w-lg mx-auto">
          Bagikan build, strategi, dan diskusi dengan pemain lain
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Tab bar + New Post button */}
        <div className="flex items-center gap-2 flex-wrap mb-6">
          <div className="flex flex-1 flex-wrap gap-1">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-all border"
                style={
                  activeTab === tab.key
                    ? { background: 'rgba(29,127,212,0.3)', color: '#93c5fd', borderColor: 'rgba(29,127,212,0.5)' }
                    : { background: 'transparent', color: 'rgba(255,255,255,0.45)', borderColor: 'rgba(255,255,255,0.1)' }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleNewPostClick}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors"
          >
            <span className="text-lg leading-none">+</span>
            <span>Buat Post</span>
          </button>
        </div>

        {/* Post list */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/30 text-sm">Belum ada post. Jadilah yang pertama berbagi!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={handleLike}
                  onDelete={handleDelete}
                  onEdit={setEditingPost}
                  currentUserId={contributorId}
                  token={token}
                  isAuthenticated={isAuthenticated}
                  onLoginPrompt={() => setShowLoginPrompt(true)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showLoginPrompt && <LoginPrompt onClose={() => setShowLoginPrompt(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showNewPost && (
          <NewPostModal
            onClose={() => setShowNewPost(false)}
            onCreated={load}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {editingPost && (
          <EditPostModal
            post={editingPost}
            onClose={() => setEditingPost(null)}
            onUpdated={handleUpdated}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
