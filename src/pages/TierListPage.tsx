import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useHeroes } from '../hooks/useHeroes';
import { Loading } from '../components/ui/Loading';
import { Link } from '@tanstack/react-router';
import { Plus, Save, X, RotateCcw, Users, List as ListIcon, ThumbsUp, Calendar, TrendingUp, Share2, Check, Search, GripVertical, Download, Loader2, MessageCircle, Send, Trash2, BadgeCheck, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from 'framer-motion';

// Convert image URL to base64 via proxy
async function imageToBase64(url: string): Promise<string> {
  try {
    // Use proxy path for external images
    let proxyUrl = url;
    if (url.includes('honorofkings.com')) {
      const apiBase = import.meta.env.DEV ? '' : 'https://mlbbapi.project-n.site';
      proxyUrl = url.replace('https://world.honorofkings.com', `${apiBase}/proxy-image`);
    }

    const response = await fetch(proxyUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    // Return a 1x1 transparent pixel as fallback
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  }
}

// Clone element and convert all images to base64
async function cloneWithBase64Images(element: HTMLElement): Promise<HTMLElement> {
  const clone = element.cloneNode(true) as HTMLElement;
  const images = clone.querySelectorAll('img');

  await Promise.all(
    Array.from(images).map(async (img) => {
      if (img.src && !img.src.startsWith('data:')) {
        const base64 = await imageToBase64(img.src);
        img.src = base64;
      }
    })
  );

  return clone;
}
import type { Hero } from '../types/hero';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent
} from '@dnd-kit/core';
import { createTierList, updateTierList, fetchTierLists, voteTierList, fetchComments, postComment, deleteCommentApi, type TierList, type Comment } from '../api/tierLists';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../hooks/useUser';

const TIER_CONFIG = {
  'S+': { color: 'from-red-500 to-orange-500', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20', textColor: 'text-red-400' },
  'S': { color: 'from-orange-500 to-yellow-500', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/20', textColor: 'text-orange-400' },
  'A': { color: 'from-yellow-500 to-green-500', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/20', textColor: 'text-yellow-400' },
  'B': { color: 'from-green-500 to-teal-500', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/20', textColor: 'text-green-400' },
  'C': { color: 'from-blue-500 to-indigo-500', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20', textColor: 'text-blue-400' },
  'D': { color: 'from-purple-500 to-gray-500', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20', textColor: 'text-purple-400' },
};

const TIER_ORDER = ['S+', 'S', 'A', 'B', 'C', 'D'] as const;
type TierKey = typeof TIER_ORDER[number];

const LANE_ICONS: Record<string, string> = {
  'Gold Lane': '/assets/lanes/farm-lane.webp',
  'Jungle': '/assets/lanes/jungle.webp',
  'Mid Lane': '/assets/lanes/mid-lane.webp',
  'EXP Lane': '/assets/lanes/clash-lane.webp',
  'Roam': '/assets/lanes/roamer.webp',
};

function DraggableHero({ hero, showName = false }: { hero: Hero; showName?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: hero.heroId,
  });

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    touchAction: 'none',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="group relative cursor-grab active:cursor-grabbing select-none"
    >
      <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden border-2 border-white/10 group-hover:border-primary-500/50 transition-all group-hover:scale-105">
        <img src={hero.icon} alt={hero.name} className="w-full h-full object-cover pointer-events-none" draggable={false} />
      </div>
      {showName && (
        <p className="text-[9px] md:text-[10px] text-gray-400 text-center mt-1 truncate w-12 md:w-14">{hero.name}</p>
      )}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <GripVertical className="w-4 md:w-5 h-4 md:h-5 text-white drop-shadow-lg" />
      </div>
    </div>
  );
}

function DroppableTier({ tier, heroes, children }: { tier: TierKey | 'pool'; heroes: Hero[]; children?: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: tier });
  const config = tier !== 'pool' ? TIER_CONFIG[tier as TierKey] : null;

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[72px] rounded-xl transition-all duration-200 ${
        isOver
          ? 'bg-primary-500/10 ring-2 ring-primary-500 ring-inset'
          : config
            ? config.bgColor
            : ''
      }`}
    >
      {children || (
        <div className="flex flex-wrap gap-2">
          {heroes.map(hero => <DraggableHero key={hero.heroId} hero={hero} />)}
          {heroes.length === 0 && <p className="text-gray-500 text-sm">Seret hero ke sini...</p>}
        </div>
      )}
    </div>
  );
}

// ─── Comment Section Component ───────────────────────────────────────────────

function buildTree(comments: Comment[]): (Comment & { children: Comment[] })[] {
  const map = new Map<number, Comment & { children: Comment[] }>();
  const roots: (Comment & { children: Comment[] })[] = [];
  comments.forEach(c => map.set(c.id, { ...c, children: [] }));
  comments.forEach(c => {
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.children.push(map.get(c.id)!);
    } else {
      roots.push(map.get(c.id)!);
    }
  });
  return roots;
}

function CommentItem({
  comment,
  depth,
  token,
  user,
  onReply,
  onDeleted,
  replyingTo,
  setReplyingTo,
}: {
  comment: Comment & { children: Comment[] };
  depth: number;
  token: string | null;
  user: { id: string; name: string } | null;
  onReply: (parentId: number, authorName: string, content: string) => Promise<void>;
  onDeleted: (id: number) => void;
  replyingTo: number | null;
  setReplyingTo: (id: number | null) => void;
}) {
  const [replyText, setReplyText] = useState('');
  const [replyName, setReplyName] = useState(user?.name || '');
  const [submitting, setSubmitting] = useState(false);
  const isReplying = replyingTo === comment.id;
  const maxVisualDepth = 4;
  const visualDepth = Math.min(depth, maxVisualDepth);

  const handleReplySubmit = async () => {
    if (!replyText.trim() || !replyName.trim()) return;
    setSubmitting(true);
    await onReply(comment.id, replyName.trim(), replyText.trim());
    setReplyText('');
    setSubmitting(false);
    setReplyingTo(null);
  };

  const handleDelete = async () => {
    if (!token) return;
    try {
      await deleteCommentApi(comment.id, token);
      onDeleted(comment.id);
    } catch {}
  };

  const timeAgo = (dateStr: string) => {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`;
    return `${Math.floor(diff / 86400)}h lalu`;
  };

  return (
    <div className={`${visualDepth > 0 ? 'ml-4 md:ml-6 border-l border-white/10 pl-3 md:pl-4' : ''}`}>
      <div className="py-2.5 group">
        <div className="flex items-start gap-2">
          <div className="w-7 h-7 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs font-bold text-primary-400">{comment.authorName[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className="text-sm font-semibold text-white">{comment.authorName}</span>
              {comment.isVerified && (
                <span title="Verified contributor">
                  <BadgeCheck className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
                </span>
              )}
              <span className="text-xs text-gray-500">{timeAgo(comment.createdAt)}</span>
            </div>
            <p className="text-sm text-gray-300 break-words leading-relaxed">{comment.content}</p>
            <div className="flex items-center gap-3 mt-1.5">
              <button
                onClick={() => setReplyingTo(isReplying ? null : comment.id)}
                className="text-xs text-gray-500 hover:text-primary-400 transition-colors flex items-center gap-1"
              >
                <MessageCircle className="w-3 h-3" />
                Balas
              </button>
              {token && user && String(comment.contributorId) === user.id && (
                <button
                  onClick={handleDelete}
                  className="text-xs text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Hapus
                </button>
              )}
            </div>
          </div>
        </div>

        {isReplying && (
          <div className="mt-2 ml-9 space-y-2">
            {!user && (
              <input
                type="text"
                placeholder="Namamu"
                value={replyName}
                onChange={e => setReplyName(e.target.value)}
                className="w-full px-3 py-1.5 text-sm bg-dark-200/60 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50"
              />
            )}
            <div className="flex gap-2">
              <textarea
                rows={2}
                placeholder={`Balas ke ${comment.authorName}...`}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                className="flex-1 px-3 py-1.5 text-sm bg-dark-200/60 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50 resize-none"
              />
              <button
                onClick={handleReplySubmit}
                disabled={submitting || !replyText.trim() || !replyName.trim()}
                className="px-3 py-1.5 bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {comment.children.length > 0 && (
        <div>
          {comment.children.map(child => (
            <CommentItem
              key={child.id}
              comment={child as Comment & { children: Comment[] }}
              depth={depth + 1}
              token={token}
              user={user}
              onReply={onReply}
              onDeleted={onDeleted}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentSection({ tierListId }: { tierListId: string }) {
  const { token, user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [authorName, setAuthorName] = useState(user?.name || '');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchComments(tierListId)
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [tierListId]);

  const handlePost = async () => {
    const name = user?.name || authorName.trim();
    if (!newComment.trim() || !name) return;
    setSubmitting(true);
    try {
      const comment = await postComment(tierListId, {
        content: newComment.trim(),
        authorName: name,
        parentId: null,
        token: token || undefined,
      });
      setComments(prev => [...prev, comment]);
      setNewComment('');
    } catch {}
    setSubmitting(false);
  };

  const handleReply = async (parentId: number, replyAuthor: string, content: string) => {
    const name = user?.name || replyAuthor;
    const comment = await postComment(tierListId, {
      content,
      authorName: name,
      parentId,
      token: token || undefined,
    });
    setComments(prev => [...prev, comment]);
  };

  const handleDeleted = (id: number) => {
    setComments(prev => prev.filter(c => c.id !== id));
  };

  const tree = buildTree(comments);

  return (
    <div className="border-t border-white/10 p-4 md:p-6">
      <button
        onClick={() => setCollapsed(v => !v)}
        className="flex items-center gap-2 mb-4 w-full text-left"
      >
        <MessageCircle className="w-4 h-4 text-primary-400" />
        <span className="text-sm font-semibold text-white">
          Komentar <span className="text-gray-500 font-normal">({comments.length})</span>
        </span>
        {collapsed ? <ChevronDown className="w-4 h-4 text-gray-500 ml-auto" /> : <ChevronUp className="w-4 h-4 text-gray-500 ml-auto" />}
      </button>

      {!collapsed && (
        <>
          {/* New comment form */}
          <div className="mb-5 space-y-2">
            {!user && (
              <input
                type="text"
                placeholder="Namamu"
                value={authorName}
                onChange={e => setAuthorName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-dark-200/60 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50"
              />
            )}
            <div className="flex gap-2">
              <textarea
                rows={2}
                placeholder={user ? `Komentar sebagai ${user.name}...` : 'Tulis komentar...'}
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                className="flex-1 px-3 py-2 text-sm bg-dark-200/60 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50 resize-none"
              />
              <button
                onClick={handlePost}
                disabled={submitting || !newComment.trim() || (!user && !authorName.trim())}
                className="px-3 py-2 bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 rounded-lg transition-colors disabled:opacity-50 self-end flex-shrink-0"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            {!user && (
              <p className="text-xs text-gray-500">
                <Link to="/auth" className="text-primary-400 hover:underline">Masuk</Link> untuk mendapatkan badge terverifikasi pada komentarmu.
              </p>
            )}
          </div>

          {/* Comments list */}
          {loading ? (
            <div className="text-center py-6 text-gray-500 text-sm">Memuat komentar...</div>
          ) : tree.length === 0 ? (
            <div className="text-center py-6 text-gray-600 text-sm">Belum ada komentar. Jadilah yang pertama!</div>
          ) : (
            <div className="space-y-1">
              {tree.map(comment => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  depth={0}
                  token={token}
                  user={user}
                  onReply={handleReply}
                  onDeleted={handleDeleted}
                  replyingTo={replyingTo}
                  setReplyingTo={setReplyingTo}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Official Meta Tier List Component ───────────────────────────────────────

const RANK_OPTIONS = [
  { key: 'epic',           label: 'Epic',            color: 'text-purple-400',  border: 'border-purple-500/40',  bg: 'bg-purple-500/10' },
  { key: 'legend',         label: 'Legend',          color: 'text-yellow-400',  border: 'border-yellow-500/40',  bg: 'bg-yellow-500/10' },
  { key: 'mythic',         label: 'Mythic',          color: 'text-red-400',     border: 'border-red-500/40',     bg: 'bg-red-500/10' },
  { key: 'mythical_honor', label: 'Mythical Honor',  color: 'text-orange-400',  border: 'border-orange-500/40',  bg: 'bg-orange-500/10' },
  { key: 'mythical_glory', label: 'Mythical Glory+', color: 'text-amber-400',   border: 'border-amber-500/40',   bg: 'bg-amber-500/10' },
];

type MetaHero = { heroId: number; name: string; icon: string; winRate: string; pickRate: string; banRate: string; tier: string };
type MetaRanks = { updatedAt: string; ranks: Record<string, { label: string; heroes: MetaHero[] }> };

function OfficialMetaTierList({ tierConfig, tierOrder }: { tierConfig: typeof TIER_CONFIG; tierOrder: typeof TIER_ORDER }) {
  const [selectedRank, setSelectedRank] = useState('mythic');
  const [metaData, setMetaData] = useState<MetaRanks | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const API_BASE = import.meta.env.DEV ? '' : 'https://mlbbapi.project-n.site';

  useEffect(() => {
    fetch(`${API_BASE}/api/meta-ranks`)
      .then(r => r.json())
      .then(d => { setMetaData(d); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  const heroes = metaData?.ranks[selectedRank]?.heroes || [];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-white">Meta Resmi</h2>
          <p className="text-[10px] text-gray-500 mt-0.5">Data langsung dari Moonton</p>
        </div>
        {/* Rank Switcher */}
        <div className="flex gap-1.5 flex-wrap sm:ml-auto">
          {RANK_OPTIONS.map(rank => (
            <button
              key={rank.key}
              onClick={() => setSelectedRank(rank.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                selectedRank === rank.key
                  ? `${rank.color} ${rank.border} ${rank.bg}`
                  : 'text-gray-500 border-white/10 hover:text-white hover:border-white/20'
              }`}
            >
              {rank.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40 bg-dark-300/50 rounded-2xl border border-white/5">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
        </div>
      ) : (
        <div className="bg-dark-300/50 border border-white/5 rounded-2xl overflow-hidden">
          {tierOrder.map(tier => {
            const config = tierConfig[tier];
            const tierHeroes = heroes.filter(h => h.tier === tier);
            if (tierHeroes.length === 0) return null;
            return (
              <div key={tier} className="flex items-stretch border-b border-white/5 last:border-b-0">
                <div className={`w-14 md:w-20 flex items-center justify-center bg-gradient-to-br ${config.color} flex-shrink-0`}>
                  <span className="text-2xl md:text-3xl font-bold text-white">{tier}</span>
                </div>
                <div className={`flex-1 p-3 md:p-4 ${config.bgColor}`}>
                  <div className="flex flex-wrap gap-1.5 md:gap-2">
                    {tierHeroes.map(hero => (
                      <Link
                        key={hero.heroId}
                        to="/heroes/$heroId"
                        params={{ heroId: hero.heroId.toString() }}
                        className="group relative"
                        title={`${hero.name} | WR: ${hero.winRate}% | Pick: ${hero.pickRate}%`}
                      >
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden border-2 border-white/10 group-hover:border-primary-500 transition-all group-hover:scale-105">
                          <img src={hero.icon} alt={hero.name} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display='none'; }} />
                        </div>
                        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                          <span className="text-[9px] bg-black/90 text-white px-1.5 py-0.5 rounded">{hero.name}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export function TierListPage() {
  useEffect(() => {
    document.title = 'Tier List - Mobile Legends: Bang Bang | MLBB Hub';
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', 'Up-to-date Mobile Legends: Bang Bang tier list. See the best heroes ranked by role and current meta.');
    return () => { document.title = 'MLBB Hub - Mobile Legends: Bang Bang Community Hub'; };
  }, []);

  const { data: heroes, isLoading } = useHeroes();
  const { token, user: authUser } = useAuth();
  const { data: user } = useUser();
  // Get tier list ID from URL
  const searchParams = new URLSearchParams(window.location.search);
  const tierListIdFromUrl = searchParams.get('id');
  const [mode, setMode] = useState<'create' | 'view'>('view');

  const [communityTierLists, setCommunityTierLists] = useState<TierList[]>([]);
  const [isLoadingTierLists, setIsLoadingTierLists] = useState(false);
  const [selectedTierList, setSelectedTierList] = useState<TierList | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('popular');

  const [tierAssignments, setTierAssignments] = useState<Record<TierKey, number[]>>({
    'S+': [], 'S': [], 'A': [], 'B': [], 'C': [], 'D': [],
  });
  const [activeDragHero, setActiveDragHero] = useState<Hero | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [tierListTitle, setTierListTitle] = useState('');
  const [creatorName, setCreatorName] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [poolSearch, setPoolSearch] = useState('');
    const [isDownloading, setIsDownloading] = useState(false);
  const [editMode, setEditMode] = useState<'drag' | 'tap'>('tap');
  const [selectedTier, setSelectedTier] = useState<TierKey | null>(null);
  const [showHeroModal, setShowHeroModal] = useState(false);
  const [tierListLane, setTierListLane] = useState<string>('All'); // Main lane filter for tier list
  const [showShareMenu, setShowShareMenu] = useState<string | null>(null); // tier list id
  const [urlTierListHandled, setUrlTierListHandled] = useState(false); // prevent re-opening from URL
  const [editingTierListId, setEditingTierListId] = useState<string | null>(null);
  const tierListRef = useRef<HTMLDivElement>(null);
  const createTierListRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(async () => {
    if (!tierListRef.current || !selectedTierList) return;

    setIsDownloading(true);
    try {
      // Clone element and convert images to base64 to avoid CORS issues
      const clone = await cloneWithBase64Images(tierListRef.current);
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      clone.style.width = `${tierListRef.current.offsetWidth}px`;
      document.body.appendChild(clone);

      const canvas = await html2canvas(clone, {
        backgroundColor: '#0a0e27',
        scale: 2,
        logging: false,
      });

      document.body.removeChild(clone);

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `${selectedTierList.title.replace(/[^a-z0-9]/gi, '_')}_tierlist.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to download tier list:', error);
      alert('Gagal mengunduh tier list. Coba lagi.');
    } finally {
      setIsDownloading(false);
    }
  }, [selectedTierList]);

  const handleDownloadCreate = useCallback(async () => {
    if (!createTierListRef.current) return;

    setIsDownloading(true);
    try {
      // Show title for download
      const titleEl = document.getElementById('create-tier-title');
      if (titleEl) titleEl.classList.remove('hidden');

      // Clone element and convert images to base64 to avoid CORS issues
      const clone = await cloneWithBase64Images(createTierListRef.current);
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      document.body.appendChild(clone);

      // Hide title in original again
      if (titleEl) titleEl.classList.add('hidden');

      const canvas = await html2canvas(clone, {
        backgroundColor: '#0a0e27',
        scale: 2,
        logging: false,
      });

      document.body.removeChild(clone);

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `my_tierlist_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to download tier list:', error);
      alert('Gagal mengunduh tier list. Coba lagi.');
      // Ensure title is hidden on error too
      const titleEl = document.getElementById('create-tier-title');
      if (titleEl) titleEl.classList.add('hidden');
    } finally {
      setIsDownloading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.name && !creatorName) setCreatorName(user.name);
  }, [user?.name, creatorName]);

  useEffect(() => {
    if (mode === 'view') loadTierLists();
  }, [mode]);

  // Auto-open tier list from URL param (only once)
  useEffect(() => {
    if (tierListIdFromUrl && communityTierLists.length > 0 && !urlTierListHandled) {
      const tierList = communityTierLists.find(tl => tl.id === tierListIdFromUrl);
      if (tierList) {
        setSelectedTierList(tierList);
        setUrlTierListHandled(true);
      }
    }
  }, [tierListIdFromUrl, communityTierLists, urlTierListHandled]);

  const loadTierLists = async () => {
    setIsLoadingTierLists(true);
    try {
      const lists = await fetchTierLists();
      setCommunityTierLists(lists);
    } catch (error) {
      console.error('Failed to load tier lists:', error);
      setCommunityTierLists([]);
    } finally {
      setIsLoadingTierLists(false);
    }
  };

  const handleEdit = (tierList: TierList) => {
    setTierAssignments(tierList.tiers as Record<TierKey, number[]>);
    setTierListTitle(tierList.title);
    setEditingTierListId(tierList.id);
    setSelectedTierList(null);
    setMode('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVote = async (tierListId: string) => {
    try {
      const updated = await voteTierList(tierListId, token || undefined);
      setCommunityTierLists(prev => prev.map(tl => tl.id === tierListId ? updated : tl));
      if (selectedTierList?.id === tierListId) setSelectedTierList(updated);
    } catch (error) {
      alert((error as Error).message);
    }
  };

  const getShareUrl = (tierListId: string) => {
    const baseUrl = import.meta.env.PROD ? 'https://mlbb-hub.project-n.site' : window.location.origin;
    return `${baseUrl}/tier-list?id=${tierListId}`;
  };

  const handleCopyLink = async (tierListId: string) => {
    const url = getShareUrl(tierListId);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(tierListId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      alert('Gagal menyalin link');
    }
  };

  const handleShare = async (tierList: TierList) => {
    const url = getShareUrl(tierList.id);
    const text = `Check out "${tierList.title}" tier list by ${tierList.creatorName} on MLBB Hub!`;

    // Try native share first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({ title: tierList.title, text, url });
        return;
      } catch {
        // User cancelled or not supported, show menu
      }
    }

    // Show share menu
    setShowShareMenu(tierList.id);
  };

  const getShareLinks = (tierList: TierList) => {
    const url = getShareUrl(tierList.id);
    const text = `Check out "${tierList.title}" tier list by ${tierList.creatorName} on MLBB Hub!`;
    return [
      { name: 'Twitter / X', icon: '𝕏', url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}` },
      { name: 'WhatsApp', icon: '💬', url: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}` },
      { name: 'Facebook', icon: '📘', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
      { name: 'Telegram', icon: '✈️', url: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}` },
    ];
  };

  const sortedTierLists = useMemo(() => {
    const sorted = [...communityTierLists];
    if (sortBy === 'popular') sorted.sort((a, b) => b.votes - a.votes);
    else sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return sorted;
  }, [communityTierLists, sortBy]);

  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 8 } });
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } });
  const sensors = useSensors(pointerSensor, touchSensor);

  // Heroes available for this tier list (filtered by tierListLane)
  const availableHeroes = useMemo(() => {
    if (!heroes) return [];
    if (tierListLane === 'All') return heroes;
    return heroes.filter(h => h.lanes?.includes(tierListLane) || h.lane === tierListLane);
  }, [heroes, tierListLane]);

  const unassignedHeroIds = useMemo(() => {
    if (!availableHeroes.length) return new Set<number>();
    const assignedIds = new Set(Object.values(tierAssignments).flat());
    return new Set(availableHeroes.map(h => h.heroId).filter(id => !assignedIds.has(id)));
  }, [availableHeroes, tierAssignments]);

  const unassignedHeroes = useMemo(() => {
    return availableHeroes.filter(h => unassignedHeroIds.has(h.heroId));
  }, [availableHeroes, unassignedHeroIds]);

  // Filtered heroes for pool (search only, role is filtered by tierListRole)
  const filteredPoolHeroes = useMemo(() => {
    if (!poolSearch) return unassignedHeroes;
    return unassignedHeroes.filter(h =>
      h.name.toLowerCase().includes(poolSearch.toLowerCase())
    );
  }, [unassignedHeroes, poolSearch]);

  // Get unique lanes
  const lanes = useMemo(() => {
    if (!heroes) return [];
    const laneSet = new Set(heroes.map(h => h.lane));
    return ['All', ...Array.from(laneSet).sort()];
  }, [heroes]);

  // Count heroes per tier
  const getTierCount = (tier: TierKey) => tierAssignments[tier].length;

  const getHeroesInTier = (tier: TierKey): Hero[] => {
    if (!heroes) return [];
    return tierAssignments[tier].map(id => heroes.find(h => h.heroId === id)).filter(Boolean) as Hero[];
  };

  const handleDragStart = (event: DragStartEvent) => {
    const hero = heroes?.find(h => h.heroId === Number(event.active.id));
    if (hero) setActiveDragHero(hero);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragHero(null);
    if (!over) return;

    const heroId = Number(active.id);
    const targetTier = over.id as TierKey | 'pool';

    const newAssignments = { ...tierAssignments };
    TIER_ORDER.forEach(tier => {
      newAssignments[tier] = newAssignments[tier].filter(id => id !== heroId);
    });

    if (targetTier !== 'pool' && TIER_ORDER.includes(targetTier as TierKey)) {
      newAssignments[targetTier as TierKey].push(heroId);
    }

    setTierAssignments(newAssignments);
  };

  const handleReset = () => {
    setTierAssignments({ 'S+': [], 'S': [], 'A': [], 'B': [], 'C': [], 'D': [] });
    setSelectedTier(null);
    setTierListLane('All');
    setPoolSearch('');
    setEditingTierListId(null);
    setTierListTitle('');
  };

  // Tap mode handlers
  const handleSelectTier = (tier: TierKey) => {
    setSelectedTier(tier);
    setShowHeroModal(true);
  };

  const handleTapHeroFromPool = (heroId: number) => {
    if (!selectedTier) return;
    setTierAssignments(prev => ({
      ...prev,
      [selectedTier]: [...prev[selectedTier], heroId]
    }));
    // Modal stays open so user can add more heroes
  };

  const handleTapHeroFromTier = (heroId: number, tier: TierKey) => {
    setTierAssignments(prev => ({
      ...prev,
      [tier]: prev[tier].filter(id => id !== heroId)
    }));
  };

  const closeHeroModal = () => {
    setShowHeroModal(false);
    setSelectedTier(null);
  };

  const handleSave = async () => {
    if (!tierListTitle.trim() || !creatorName.trim()) {
      alert('Masukkan judul dan namamu');
      return;
    }

    setIsSaving(true);
    try {
      if (editingTierListId && token) {
        const updated = await updateTierList({
          id: editingTierListId,
          title: tierListTitle.trim(),
          tiers: tierAssignments,
          token,
        });
        setCommunityTierLists(prev => prev.map(tl => tl.id === updated.id ? updated : tl));
        setEditingTierListId(null);
      } else {
        const newTierList = await createTierList({
          title: tierListTitle.trim(),
          creatorName: creatorName.trim(),
          tiers: tierAssignments,
          token: token || undefined,
        });
        setCommunityTierLists(prev => [newTierList, ...prev]);
      }

      setShowSaveModal(false);
      setTierListTitle('');
      if (!user) setCreatorName('');
      handleReset();
      setMode('view');
    } catch (error) {
      alert('Gagal menyimpan tier list: ' + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading message="Memuat tier list..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-400">
      {/* Header */}
      <section className="pt-20 md:pt-28 pb-6 md:pb-8 border-b border-white/5">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-2 md:mb-3">
              Tier List
            </h1>
            <p className="text-gray-400 text-sm md:text-lg">
              {mode === 'create'
                ? 'Buat tier list-mu sendiri dengan menyeret hero'
                : 'Lihat peringkat meta dan tier list komunitas'}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Controls */}
      <section className="sticky top-16 md:top-20 z-30 bg-dark-400/95 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-3 md:py-4">
          <div className="flex items-center justify-between gap-2">
            {/* Mode Tabs */}
            <div className="flex items-center gap-1 bg-dark-300/50 p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setMode('view')}
                className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                  mode === 'view' ? 'bg-white text-dark-400' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <ListIcon className="w-3.5 md:w-4 h-3.5 md:h-4" />
                Lihat
              </button>
              <button
                onClick={() => setMode('create')}
                className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                  mode === 'create' ? 'bg-white text-dark-400' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Plus className="w-3.5 md:w-4 h-3.5 md:h-4" />
                Buat
              </button>
            </div>

            {/* Sort Controls (View Mode) */}
            {mode === 'view' && (
              <div className="flex items-center gap-1 bg-dark-300/50 p-1 rounded-xl border border-white/5">
                <button
                  onClick={() => setSortBy('popular')}
                  className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-medium transition-all ${
                    sortBy === 'popular' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-3 md:w-3.5 h-3 md:h-3.5" />
                  <span className="hidden xs:inline">Populer</span>
                </button>
                <button
                  onClick={() => setSortBy('newest')}
                  className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-medium transition-all ${
                    sortBy === 'newest' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Calendar className="w-3 md:w-3.5 h-3 md:h-3.5" />
                  <span className="hidden xs:inline">Terbaru</span>
                </button>
              </div>
            )}

            {/* Create Mode Actions */}
            {mode === 'create' && (
              <div className="flex items-center gap-1.5 md:gap-2">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 text-red-400 hover:bg-red-500/10 rounded-lg text-xs md:text-sm transition-colors"
                >
                  <RotateCcw className="w-3.5 md:w-4 h-3.5 md:h-4" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
                <button
                  onClick={handleDownloadCreate}
                  disabled={isDownloading || Object.values(tierAssignments).every(arr => arr.length === 0)}
                  className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs md:text-sm transition-colors"
                >
                  {isDownloading ? (
                    <Loader2 className="w-3.5 md:w-4 h-3.5 md:h-4 animate-spin" />
                  ) : (
                    <Download className="w-3.5 md:w-4 h-3.5 md:h-4" />
                  )}
                  <span className="hidden sm:inline">Unduh</span>
                </button>
                <button
                  onClick={() => setShowSaveModal(true)}
                  disabled={Object.values(tierAssignments).every(arr => arr.length === 0)}
                  className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-xs md:text-sm font-medium transition-colors"
                >
                  <Save className="w-3.5 md:w-4 h-3.5 md:h-4" />
                  Simpan
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-6 md:py-8">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          {/* Create Mode */}
          {mode === 'create' && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              {/* Role Filter & Mode Toggle */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 md:mb-6 space-y-3"
              >
                {/* Lane Filter */}
                <div className="p-3 md:p-4 bg-dark-300/50 border border-white/5 rounded-xl">
                  <p className="text-xs text-gray-400 mb-2">Buat tier list untuk:</p>
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    {lanes.map(lane => (
                      <button
                        key={lane}
                        onClick={() => {
                          setTierListLane(lane);
                          // Reset assignments when changing lane filter
                          if (lane !== tierListLane) {
                            setTierAssignments({ 'S+': [], 'S': [], 'A': [], 'B': [], 'C': [], 'D': [] });
                          }
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all shrink-0 ${
                          tierListLane === lane
                            ? 'bg-primary-500 text-white'
                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                        title={lane === 'All' ? 'All Lanes' : lane}
                      >
                        {LANE_ICONS[lane] ? (
                          <img
                            src={LANE_ICONS[lane]}
                            alt={lane}
                            className="w-6 h-6 object-contain"
                          />
                        ) : (
                          <span>{lane === 'All' ? 'All' : lane.replace(' Lane', '')}</span>
                        )}
                        {lane !== 'All' && heroes && (
                          <span className="text-[10px] opacity-70">
                            {heroes.filter(h => h.lanes?.includes(lane) || h.lane === lane).length}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mode Toggle & Instructions */}
                <div className="p-3 md:p-4 bg-primary-500/5 border border-primary-500/10 rounded-xl">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="text-xs md:text-sm text-gray-300">
                      <span className="text-primary-400 font-medium">Mode:</span>{' '}
                      {editMode === 'drag' ? 'Drag & Drop' : 'Tap untuk Tambah'}
                    </p>
                    <div className="flex items-center gap-1 bg-dark-300/50 p-0.5 rounded-lg border border-white/5">
                      <button
                        onClick={() => setEditMode('tap')}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                          editMode === 'tap' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Tap
                      </button>
                      <button
                        onClick={() => setEditMode('drag')}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                          editMode === 'drag' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Drag
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] md:text-xs text-gray-500">
                    {editMode === 'drag'
                      ? 'Tahan dan seret hero ke tier. Lepas ke pool untuk menghapus.'
                      : 'Tap tier untuk menambah hero. Tap hero di tier untuk menghapus.'}
                  </p>
                </div>
              </motion.div>

              <div className={`grid gap-4 md:gap-6 ${editMode === 'drag' ? 'grid-cols-1 lg:grid-cols-[320px_1fr]' : 'grid-cols-1'}`}>
                {/* Hero Pool - Only show in drag mode */}
                {editMode === 'drag' && (
                <div className="lg:sticky lg:top-36 lg:self-start">
                  <div className="rounded-2xl overflow-hidden bg-dark-300/50 border border-white/5 max-h-[50vh] lg:max-h-[calc(100vh-220px)] flex flex-col">
                    {/* Pool Header */}
                    <div className="p-4 border-b border-white/5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-white">Pool Hero</h2>
                        <span className="px-2 py-0.5 bg-white/10 rounded-full text-xs text-gray-400">
                          {filteredPoolHeroes.length} / {unassignedHeroes.length}
                        </span>
                      </div>

                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="text"
                          placeholder="Cari hero..."
                          value={poolSearch}
                          onChange={(e) => setPoolSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-dark-200/50 border border-white/5 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50"
                        />
                      </div>

                    </div>

                    {/* Pool Content */}
                    <div className="p-2 md:p-3 overflow-y-auto flex-1">
                      {editMode === 'drag' ? (
                        <DroppableTier tier="pool" heroes={filteredPoolHeroes}>
                          <div className="grid grid-cols-5 md:grid-cols-4 gap-1.5 md:gap-2">
                            {filteredPoolHeroes.map(hero => (
                              <DraggableHero key={hero.heroId} hero={hero} showName />
                            ))}
                            {filteredPoolHeroes.length === 0 && unassignedHeroes.length > 0 && (
                              <p className="col-span-5 md:col-span-4 text-gray-500 text-sm text-center py-6">Tidak ada hero yang cocok</p>
                            )}
                            {unassignedHeroes.length === 0 && (
                              <div className="col-span-5 md:col-span-4 text-center py-8">
                                <Check className="w-8 h-8 text-green-400 mx-auto mb-2" />
                                <p className="text-green-400 text-sm font-medium">Semua hero sudah ditempatkan!</p>
                              </div>
                            )}
                          </div>
                        </DroppableTier>
                      ) : (
                        <div className="grid grid-cols-5 md:grid-cols-4 gap-1.5 md:gap-2">
                          {filteredPoolHeroes.map(hero => (
                            <button
                              key={hero.heroId}
                              onClick={() => handleTapHeroFromPool(hero.heroId)}
                              disabled={!selectedTier}
                              className={`group relative ${!selectedTier ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden border-2 transition-all ${
                                selectedTier ? 'border-white/10 hover:border-primary-500 hover:scale-105' : 'border-white/5'
                              }`}>
                                <img src={hero.icon} alt={hero.name} className="w-full h-full object-cover" />
                              </div>
                              <p className="text-[9px] md:text-[10px] text-gray-400 text-center mt-1 truncate w-12 md:w-14">{hero.name}</p>
                              {selectedTier && (
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                  <Plus className="w-5 h-5 text-primary-400 drop-shadow-lg" />
                                </div>
                              )}
                            </button>
                          ))}
                          {filteredPoolHeroes.length === 0 && unassignedHeroes.length > 0 && (
                            <p className="col-span-5 md:col-span-4 text-gray-500 text-sm text-center py-6">Tidak ada hero yang cocok</p>
                          )}
                          {unassignedHeroes.length === 0 && (
                            <div className="col-span-5 md:col-span-4 text-center py-8">
                              <Check className="w-8 h-8 text-green-400 mx-auto mb-2" />
                              <p className="text-green-400 text-sm font-medium">Semua hero sudah ditempatkan!</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                )}

                {/* Tier Containers */}
                <div className="space-y-2 md:space-y-3">
                  {/* Downloadable area */}
                  <div ref={createTierListRef} className="space-y-3 p-4 -m-4 bg-dark-400">
                    {/* Title for download */}
                    <div className="pb-3 border-b border-white/10 hidden" id="create-tier-title">
                      <h3 className="text-xl font-bold text-white">
                        {tierListLane === 'All' ? 'My Tier List' : `${tierListLane.replace(' Lane', '')} Tier List`}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">MLBB Hub</p>
                    </div>

                    {TIER_ORDER.map((tier, index) => {
                      const config = TIER_CONFIG[tier];
                      const tierHeroes = getHeroesInTier(tier);
                      const count = getTierCount(tier);

                      return (
                        <motion.div
                          key={tier}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="rounded-2xl overflow-hidden bg-dark-300/50 border border-white/5 hover:border-white/10 transition-all"
                        >
                          <div className="flex items-stretch">
                            {/* Tier Label - clickable in tap mode */}
                            <button
                              onClick={() => editMode === 'tap' && handleSelectTier(tier)}
                              className={`bg-gradient-to-br ${config.color} w-14 md:w-20 flex flex-col items-center justify-center flex-shrink-0 py-3 md:py-4 ${
                                editMode === 'tap' ? 'cursor-pointer hover:opacity-90 active:opacity-80' : 'cursor-default'
                              }`}
                            >
                              <span className="text-2xl md:text-3xl font-bold text-white">{tier}</span>
                              {count > 0 && (
                                <span className="text-[10px] md:text-xs text-white/70 mt-0.5 md:mt-1">{count}</span>
                              )}
                              {editMode === 'tap' && (
                                <Plus className="w-4 h-4 text-white/70 mt-1" />
                              )}
                            </button>

                            {/* Heroes Zone */}
                            <div className="flex-1 p-2 md:p-4">
                              {editMode === 'drag' ? (
                                <DroppableTier tier={tier} heroes={tierHeroes}>
                                  <div className="flex flex-wrap gap-1.5 md:gap-2 min-h-[56px] md:min-h-[72px]">
                                    {tierHeroes.map(hero => (
                                      <DraggableHero key={hero.heroId} hero={hero} />
                                    ))}
                                    {tierHeroes.length === 0 && (
                                      <div className="flex items-center gap-2 text-gray-500">
                                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center">
                                          <Plus className="w-4 md:w-5 h-4 md:h-5 text-gray-600" />
                                        </div>
                                        <p className="text-xs md:text-sm">Seret hero ke sini</p>
                                      </div>
                                    )}
                                  </div>
                                </DroppableTier>
                              ) : (
                                <div className="flex flex-wrap gap-1.5 md:gap-2 min-h-[56px] md:min-h-[72px]">
                                  {tierHeroes.map(hero => (
                                    <button
                                      key={hero.heroId}
                                      onClick={() => handleTapHeroFromTier(hero.heroId, tier)}
                                      className="group relative cursor-pointer"
                                    >
                                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden border-2 border-white/10 hover:border-red-500 transition-all hover:scale-105">
                                        <img src={hero.icon} alt={hero.name} className="w-full h-full object-cover" />
                                      </div>
                                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-black/40 rounded-xl">
                                        <X className="w-5 h-5 text-red-400 drop-shadow-lg" />
                                      </div>
                                    </button>
                                  ))}
                                  {tierHeroes.length === 0 && (
                                    <div className="flex items-center gap-2 text-gray-500">
                                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center">
                                        <Plus className="w-4 md:w-5 h-4 md:h-5 text-gray-600" />
                                      </div>
                                      <p className="text-xs md:text-sm">Tap tier untuk menambah</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}

                    {/* Watermark for download */}
                    <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-gray-500">
                      <span>mlbb-hub.project-n.site</span>
                      <span>{new Date().toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Summary - outside downloadable area */}
                  <div className="mt-6 p-4 bg-dark-300/30 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">
                        {tierListLane === 'All' ? 'Total ditempatkan:' : `${tierListLane.replace(' Lane', '')} ditempatkan:`}
                      </span>
                      <span className="text-white font-medium">
                        {Object.values(tierAssignments).flat().length} / {availableHeroes.length} hero
                      </span>
                    </div>
                    <div className="mt-3 h-2 bg-dark-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-500 to-blue-500 transition-all duration-300"
                        style={{
                          width: `${(Object.values(tierAssignments).flat().length / (availableHeroes.length || 1)) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {editMode === 'drag' && (
                <DragOverlay>
                  {activeDragHero && (
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden ring-2 ring-primary-500 shadow-xl shadow-primary-500/20">
                      <img src={activeDragHero.icon} alt={activeDragHero.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                </DragOverlay>
              )}
            </DndContext>
          )}

          {/* Hero Selection Modal for Tap Mode */}
          <AnimatePresence>
            {showHeroModal && selectedTier && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm"
                onClick={closeHeroModal}
              >
                <motion.div
                  initial={{ y: '100%', opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: '100%', opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="relative w-full max-w-2xl max-h-[85vh] bg-dark-300 rounded-t-2xl md:rounded-2xl flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-4 border-b border-white/5 flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${TIER_CONFIG[selectedTier].color}`}>
                        <span className="text-lg font-bold text-white">{selectedTier}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">
                          Tambah {tierListLane !== 'All' && <span className="text-primary-400">{tierListLane.replace(' Lane', '')}</span>} ke {selectedTier}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {tierAssignments[selectedTier].length} ditambahkan • {unassignedHeroes.length} tersisa
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={closeHeroModal}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  {/* Search */}
                  <div className="p-3 border-b border-white/5 flex-shrink-0">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        placeholder={`Cari ${tierListLane !== 'All' ? 'hero ' + tierListLane.replace(' Lane', '').toLowerCase() : 'hero'}...`}
                        value={poolSearch}
                        onChange={(e) => setPoolSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-dark-200/50 border border-white/5 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50"
                      />
                    </div>
                  </div>

                  {/* Heroes Grid */}
                  <div className="flex-1 overflow-y-auto p-3">
                    <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 gap-2">
                      {filteredPoolHeroes.map(hero => (
                        <button
                          key={hero.heroId}
                          onClick={() => handleTapHeroFromPool(hero.heroId)}
                          className="group relative"
                        >
                          <div className="w-full aspect-square rounded-xl overflow-hidden border-2 border-white/10 hover:border-primary-500 transition-all hover:scale-105">
                            <img src={hero.icon} alt={hero.name} className="w-full h-full object-cover" />
                          </div>
                          <p className="text-[9px] text-gray-400 text-center mt-1 truncate">{hero.name}</p>
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                              <Plus className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        </button>
                      ))}
                      {filteredPoolHeroes.length === 0 && unassignedHeroes.length > 0 && (
                        <p className="col-span-full text-gray-500 text-sm text-center py-8">Tidak ada hero yang cocok</p>
                      )}
                      {unassignedHeroes.length === 0 && (
                        <div className="col-span-full text-center py-8">
                          <Check className="w-8 h-8 text-green-400 mx-auto mb-2" />
                          <p className="text-green-400 text-sm font-medium">Semua hero sudah ditempatkan!</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="p-3 border-t border-white/5 flex-shrink-0">
                    <button
                      onClick={closeHeroModal}
                      className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors"
                    >
                      Selesai
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* View Mode */}
          {mode === 'view' && (
            <div className="space-y-8 md:space-y-10">
              {/* Official Meta Tier List */}
              <OfficialMetaTierList tierConfig={TIER_CONFIG} tierOrder={TIER_ORDER} />

              {/* Community Tier Lists */}
              <div>
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <h2 className="text-lg md:text-xl font-semibold text-white">Komunitas</h2>
                    <span className="text-[10px] md:text-xs text-gray-500">{sortedTierLists.length} tier list</span>
                  </div>
                </div>

                {isLoadingTierLists ? (
                  <Loading message="Memuat tier list komunitas..." />
                ) : sortedTierLists.length === 0 ? (
                  <div className="text-center py-12 md:py-16 bg-dark-300/50 rounded-2xl border border-white/5">
                    <Users className="w-10 md:w-12 h-10 md:h-12 text-gray-600 mx-auto mb-3 md:mb-4" />
                    <h3 className="text-base md:text-lg font-semibold text-white mb-2">Belum Ada Tier List</h3>
                    <p className="text-gray-400 text-xs md:text-sm mb-4 md:mb-6">Jadilah yang pertama membuatnya!</p>
                    <button
                      onClick={() => setMode('create')}
                      className="px-5 md:px-6 py-2 md:py-2.5 bg-white text-dark-400 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
                    >
                      Buat Tier List
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
                    {sortedTierLists.map((tierList, index) => (
                      <motion.div
                        key={tierList.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.2) }}
                        onClick={() => setSelectedTierList(tierList)}
                        className="bg-dark-300/50 border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all cursor-pointer group"
                      >
                        {/* Card Header */}
                        <div className="p-4 border-b border-white/5">
                          <h3 className="font-semibold text-white mb-2 group-hover:text-primary-400 transition-colors">
                            {tierList.title}
                          </h3>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-3">
                              <span className="text-gray-400">
                                by <span className="text-primary-400">{tierList.creatorName}</span>
                              </span>
                              <span className="text-gray-500 text-xs">
                                {new Date(tierList.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {authUser && tierList.creatorId && String(authUser.id) === String(tierList.creatorId) && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleEdit(tierList); }}
                                  className="p-1.5 hover:bg-primary-500/20 rounded-lg transition-colors"
                                  title="Edit tier list"
                                >
                                  <Pencil className="w-4 h-4 text-primary-400" />
                                </button>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); handleCopyLink(tierList.id); }}
                                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                              >
                                {copiedId === tierList.id ? (
                                  <Check className="w-4 h-4 text-green-400" />
                                ) : (
                                  <Share2 className="w-4 h-4 text-gray-500 hover:text-white" />
                                )}
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleVote(tierList.id); }}
                                className="flex items-center gap-1.5 px-2 py-1 hover:bg-white/10 rounded-lg transition-colors"
                              >
                                <ThumbsUp className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium text-white">{tierList.votes}</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Tier Preview */}
                        <div className="p-4 space-y-2">
                          {TIER_ORDER.map(tier => {
                            const tierHeroIds = tierList.tiers[tier] || [];
                            if (tierHeroIds.length === 0) return null;

                            const config = TIER_CONFIG[tier];
                            const tierHeroes = tierHeroIds
                              .map(id => heroes?.find(h => h.heroId === id))
                              .filter(Boolean) as Hero[];

                            return (
                              <div key={tier} className="flex items-center gap-2">
                                <div className={`w-10 h-7 rounded flex items-center justify-center bg-gradient-to-r ${config.color}`}>
                                  <span className="text-white font-bold text-xs">{tier}</span>
                                </div>
                                <div className="flex-1 flex flex-wrap gap-1">
                                  {tierHeroes.slice(0, 8).map(hero => (
                                    <img
                                      key={hero.heroId}
                                      src={hero.icon}
                                      alt={hero.name}
                                      className="w-7 h-7 rounded border border-white/10"
                                    />
                                  ))}
                                  {tierHeroes.length > 8 && (
                                    <div className="w-7 h-7 rounded bg-dark-200 border border-white/10 flex items-center justify-center text-xs text-gray-400">
                                      +{tierHeroes.length - 8}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Tier List Detail Modal */}
      <AnimatePresence>
        {selectedTierList && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-black/95 md:bg-black/90 backdrop-blur-sm"
            onClick={() => setSelectedTierList(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-dark-300 rounded-xl md:rounded-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedTierList(null)}
                className="absolute top-3 right-3 md:top-4 md:right-4 z-10 p-2 md:p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-4 md:w-5 h-4 md:h-5 text-white" />
              </button>

              {/* Modal Header - Fixed */}
              <div className="p-4 md:p-6 border-b border-white/5 flex-shrink-0">
                <h2 className="text-lg md:text-2xl font-bold text-white mb-2 pr-8">{selectedTierList.title}</h2>
                <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm flex-wrap">
                  <span className="text-gray-400">
                    by <span className="text-primary-400 font-medium">{selectedTierList.creatorName}</span>
                  </span>
                  <span className="text-gray-500">{new Date(selectedTierList.createdAt).toLocaleDateString()}</span>
                  <div className="ml-auto flex items-center gap-1.5 md:gap-2">
                    {authUser && selectedTierList.creatorId && String(authUser.id) === String(selectedTierList.creatorId) && (
                      <button
                        onClick={() => handleEdit(selectedTierList)}
                        className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 rounded-lg transition-colors"
                      >
                        <Pencil className="w-3.5 md:w-4 h-3.5 md:h-4" />
                        <span className="text-xs md:text-sm hidden sm:inline">Edit</span>
                      </button>
                    )}
                    <button
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isDownloading ? (
                        <Loader2 className="w-3.5 md:w-4 h-3.5 md:h-4 animate-spin" />
                      ) : (
                        <Download className="w-3.5 md:w-4 h-3.5 md:h-4" />
                      )}
                      <span className="text-xs md:text-sm hidden sm:inline">
                        {isDownloading ? 'Menyimpan...' : 'Unduh'}
                      </span>
                    </button>
                    <button
                      onClick={() => handleShare(selectedTierList)}
                      className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {copiedId === selectedTierList.id ? (
                        <Check className="w-3.5 md:w-4 h-3.5 md:h-4 text-green-400" />
                      ) : (
                        <Share2 className="w-3.5 md:w-4 h-3.5 md:h-4 text-gray-400" />
                      )}
                      <span className="text-xs md:text-sm text-white hidden sm:inline">Bagikan</span>
                    </button>
                    <button
                      onClick={() => handleVote(selectedTierList.id)}
                      className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <ThumbsUp className="w-3.5 md:w-4 h-3.5 md:h-4 text-gray-400" />
                      <span className="text-xs md:text-sm font-medium text-white">{selectedTierList.votes}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="overflow-y-auto flex-1">
                <div ref={tierListRef} className="p-4 md:p-6 space-y-2 md:space-y-3 bg-dark-300">
                  {/* Title for download image */}
                  <div className="pb-3 mb-3 border-b border-white/10">
                    <h3 className="text-xl font-bold text-white">{selectedTierList.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">by {selectedTierList.creatorName} • MLBB Hub</p>
                  </div>

                  {TIER_ORDER.map(tier => {
                    const tierHeroIds = selectedTierList.tiers[tier] || [];
                    if (tierHeroIds.length === 0) return null;

                    const config = TIER_CONFIG[tier];
                    const tierHeroes = tierHeroIds
                      .map(id => heroes?.find(h => h.heroId === id))
                      .filter(Boolean) as Hero[];

                    return (
                      <div key={tier} className="rounded-xl overflow-hidden border border-white/5">
                        <div className="flex items-stretch">
                          <div className={`w-16 flex items-center justify-center bg-gradient-to-br ${config.color} flex-shrink-0`}>
                            <span className="text-2xl font-bold text-white">{tier}</span>
                          </div>
                          <div className={`flex-1 p-4 ${config.bgColor}`}>
                            <div className="flex flex-wrap gap-2">
                              {tierHeroes.map(hero => (
                                <div
                                  key={hero.heroId}
                                  className="w-14 h-14 rounded-lg overflow-hidden border border-white/10"
                                  title={hero.name}
                                >
                                  <img src={hero.icon} alt={hero.name} className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Watermark */}
                  <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between text-xs text-gray-500">
                    <span>mlbb-hub.project-n.site</span>
                    <span>{new Date(selectedTierList.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Comments */}
                <CommentSection tierListId={selectedTierList.id} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Modal */}
      <AnimatePresence>
        {showSaveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/95 md:bg-black/90 backdrop-blur-sm"
            onClick={() => setShowSaveModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-dark-300 rounded-xl md:rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-4 md:p-6 border-b border-white/5">
                <h2 className="text-lg md:text-xl font-bold text-white">{editingTierListId ? 'Update Tier List' : 'Simpan Tier List'}</h2>
                <p className="text-xs md:text-sm text-gray-400 mt-1">{editingTierListId ? 'Simpan perubahanmu' : 'Bagikan tier list-mu ke komunitas'}</p>
              </div>

              {/* Modal Content */}
              <div className="p-4 md:p-6 space-y-3 md:space-y-4">
                {/* Summary */}
                <div className="p-4 bg-dark-200/50 rounded-xl space-y-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Ringkasan</p>
                  <div className="flex flex-wrap gap-2">
                    {TIER_ORDER.map(tier => {
                      const count = tierAssignments[tier].length;
                      if (count === 0) return null;
                      const config = TIER_CONFIG[tier];
                      return (
                        <div key={tier} className="flex items-center gap-1.5">
                          <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold bg-gradient-to-br ${config.color} text-white`}>
                            {tier}
                          </span>
                          <span className="text-sm text-gray-300">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-sm text-gray-400">
                    Total: {Object.values(tierAssignments).flat().length} hero
                  </p>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Judul *</label>
                  <input
                    type="text"
                    value={tierListTitle}
                    onChange={(e) => setTierListTitle(e.target.value)}
                    placeholder="e.g., Season 10 Meta Tier List"
                    className="w-full px-4 py-3 bg-dark-200/50 border border-white/10 rounded-xl focus:outline-none focus:border-primary-500/50 text-white placeholder-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Namamu *</label>
                  <input
                    type="text"
                    value={creatorName}
                    onChange={(e) => setCreatorName(e.target.value)}
                    placeholder="Masukkan namamu"
                    disabled={!!user}
                    className="w-full px-4 py-3 bg-dark-200/50 border border-white/10 rounded-xl focus:outline-none focus:border-primary-500/50 text-white placeholder-gray-500 disabled:opacity-60"
                  />
                  {user ? (
                    <p className="text-xs text-gray-500 mt-1">Masuk sebagai {user.name}</p>
                  ) : (
                    <p className="text-xs text-amber-400/80 mt-1.5">
                      ⚠ Belum masuk — tier list tidak akan terhubung ke profil kontributormu.{' '}
                      <Link to="/auth" className="text-primary-400 hover:text-primary-300 underline">Masuk →</Link>
                    </p>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 md:p-6 border-t border-white/5 flex gap-2 md:gap-3">
                <button
                  onClick={handleSave}
                  disabled={isSaving || !tierListTitle.trim() || !creatorName.trim()}
                  className="flex-1 flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2.5 md:py-3 bg-white text-dark-400 rounded-xl text-sm font-medium hover:bg-gray-100 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="w-3.5 md:w-4 h-3.5 md:h-4" />
                  {isSaving ? 'Menyimpan...' : editingTierListId ? 'Update Tier List' : 'Simpan Tier List'}
                </button>
                <button
                  onClick={() => setShowSaveModal(false)}
                  disabled={isSaving}
                  className="px-4 md:px-6 py-2.5 md:py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm transition-colors"
                >
                  Batal
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Menu Modal */}
      <AnimatePresence>
        {showShareMenu && selectedTierList && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowShareMenu(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-dark-300 rounded-2xl p-4 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-white mb-4">Bagikan Tier List</h3>
              <div className="space-y-2">
                {getShareLinks(selectedTierList).map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                    onClick={() => setShowShareMenu(null)}
                  >
                    <span className="text-xl">{link.icon}</span>
                    <span className="text-white font-medium">{link.name}</span>
                  </a>
                ))}
                <button
                  onClick={() => {
                    handleCopyLink(selectedTierList.id);
                    setShowShareMenu(null);
                  }}
                  className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors w-full"
                >
                  <span className="text-xl">🔗</span>
                  <span className="text-white font-medium">Salin Link</span>
                </button>
              </div>
              <button
                onClick={() => setShowShareMenu(null)}
                className="w-full mt-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
              >
                Batal
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
