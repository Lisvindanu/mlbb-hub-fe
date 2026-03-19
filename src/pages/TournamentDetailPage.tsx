import { useState, useEffect } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Users, Copy, Check, Play, Shield, LogIn, Settings,
  Gift, CalendarDays, Lock, Eye, EyeOff, MessageCircle, ScrollText,
  ChevronLeft,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../hooks/useUser';

const API_BASE = import.meta.env.DEV ? '' : 'https://mlbbapi.project-n.site';

// ─── Layout constants ──────────────────────────────────────────────────────────
const CARD_H = 80;
const CARD_W = 200;
const CONN_W = 48;
const SLOT_GAP = 20;
const SLOT_H = CARD_H + SLOT_GAP;

function calcY(roundIdx: number, matchIdx: number): number {
  const factor = Math.pow(2, roundIdx);
  return matchIdx * SLOT_H * factor + (SLOT_H * factor - CARD_H) / 2;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Team { id: number; name: string; seed: number | null; }
interface Match {
  id: number; round: number; match_number: number; bracket: string;
  team1_id: number | null; team2_id: number | null;
  winner_id: number | null; score1: number; score2: number;
  status: string; next_match_id: number | null; loser_next_match_id: number | null;
}
interface Tournament {
  id: number; name: string; description: string;
  team_count: number; bracket_type: string; status: string;
  created_by_name: string; created_at: string;
  creator_id?: number | null;
  teams: Team[]; matches: Match[];
  prize?: string;
  rules?: string;
  scheduled_at?: string;
  room_id?: string;
  room_password?: string;
  contact?: string;
}

// ─── API helpers ──────────────────────────────────────────────────────────────
async function fetchTournament(id: string): Promise<Tournament> {
  const res = await fetch(`${API_BASE}/api/tournaments/${id}`);
  if (!res.ok) throw new Error('Tournament not found');
  return res.json();
}

async function joinTournament(id: string, team_name: string, token: string) {
  const res = await fetch(`${API_BASE}/api/tournaments/${id}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ team_name }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

async function startTournament(id: string, token: string) {
  const res = await fetch(`${API_BASE}/api/tournaments/${id}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

async function setWinner(
  id: string, match_id: number, winner_id: number,
  token: string, score1: number, score2: number,
) {
  const res = await fetch(`${API_BASE}/api/tournaments/${id}/matches/${match_id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ winner_id, score1, score2 }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

async function updateRoom(id: string, room_id: string, room_password: string, token: string) {
  const res = await fetch(`${API_BASE}/api/tournaments/${id}/room`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ room_id, room_password }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getRoundLabel(roundIdx: number, totalRounds: number): string {
  const fromEnd = totalRounds - 1 - roundIdx;
  if (fromEnd === 0) return 'Final';
  if (fromEnd === 1) return 'Semifinal';
  if (fromEnd === 2) return 'Perempat Final';
  return `Ronde ${roundIdx + 1}`;
}

function formatScheduled(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  return `${date} · ${time} WIB`;
}

function CopyButton({ text, size = 'sm' }: { text: string; size?: 'sm' | 'xs' }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  const cls = size === 'xs'
    ? 'p-1 rounded-md text-gray-500 hover:text-white hover:bg-white/10 transition-all'
    : 'p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-all';
  return (
    <button onClick={copy} className={cls} title="Salin">
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

// ─── Winner modal (global centered dialog) ────────────────────────────────────
interface WinnerModalProps {
  match: Match;
  teamId: number;
  isTeam1: boolean;
  teams: Team[];
  tournamentId: string;
  token: string;
  onSuccess: () => void;
  onClose: () => void;
}
function WinnerModal({ match, teamId, isTeam1, teams, tournamentId, token, onSuccess, onClose }: WinnerModalProps) {
  const [scores, setScores] = useState({ s1: match.score1 || 0, s2: match.score2 || 0 });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const winnerTeam = teams.find(t => t.id === teamId);
  const t1 = teams.find(t => t.id === match.team1_id);
  const t2 = teams.find(t => t.id === match.team2_id);

  async function confirm() {
    setLoading(true);
    setErr('');
    try {
      await setWinner(tournamentId, match.id, teamId, token, scores.s1, scores.s2);
      onSuccess();
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 16 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="bg-dark-300 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-yellow-500/15 border border-yellow-500/25 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Set pemenang pertandingan</p>
            <p className="text-sm font-semibold text-yellow-300 mt-0.5">{winnerTeam?.name ?? '?'}</p>
          </div>
        </div>

        {/* Score inputs */}
        <div className="bg-dark-400/60 rounded-xl p-4 mb-4">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-3">Skor Akhir</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 text-center">
              <p className="text-[11px] text-gray-400 mb-1.5 truncate">{t1?.name ?? 'Tim 1'}</p>
              <input
                type="number"
                min={0}
                value={scores.s1}
                onChange={e => setScores(s => ({ ...s, s1: Math.max(0, Number(e.target.value)) }))}
                className="w-full text-center bg-dark-500 border border-white/15 rounded-lg text-white text-xl font-bold py-2 focus:outline-none focus:border-primary-500/50 transition-colors"
              />
            </div>
            <span className="text-gray-600 font-bold text-lg">vs</span>
            <div className="flex-1 text-center">
              <p className="text-[11px] text-gray-400 mb-1.5 truncate">{t2?.name ?? 'Tim 2'}</p>
              <input
                type="number"
                min={0}
                value={scores.s2}
                onChange={e => setScores(s => ({ ...s, s2: Math.max(0, Number(e.target.value)) }))}
                className="w-full text-center bg-dark-500 border border-white/15 rounded-lg text-white text-xl font-bold py-2 focus:outline-none focus:border-primary-500/50 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Winner highlight */}
        <div className="flex items-center gap-2 bg-green-500/8 border border-green-500/20 rounded-xl px-4 py-2.5 mb-4">
          <Trophy className="w-3.5 h-3.5 text-green-400 shrink-0" />
          <p className="text-sm text-green-300">
            <span className="text-gray-400 font-normal">Pemenang: </span>
            <span className="font-semibold">{winnerTeam?.name}</span>
          </p>
        </div>

        {err && <p className="text-red-400 text-xs mb-3">{err}</p>}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium transition-all"
          >
            Batal
          </button>
          <button
            onClick={confirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all"
          >
            {loading
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><Trophy className="w-3.5 h-3.5" /> Konfirmasi</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Match Card ───────────────────────────────────────────────────────────────
function MatchCard({
  match, teams, isCreator, onRequestWinner,
}: {
  match: Match; teams: Team[]; isCreator: boolean;
  onRequestWinner: (match: Match, teamId: number, isTeam1: boolean) => void;
}) {
  const t1 = teams.find(t => t.id === match.team1_id);
  const t2 = teams.find(t => t.id === match.team2_id);
  const winner = teams.find(t => t.id === match.winner_id);

  const isBye = match.status === 'bye';
  const isDone = match.status === 'completed' || isBye;
  const isLive = !isDone && !!match.team1_id && !!match.team2_id;
  const canAdmin = isLive && isCreator;

  function handleTeamClick(teamId: number | null, isTeam1: boolean) {
    if (!canAdmin || !teamId) return;
    onRequestWinner(match, teamId, isTeam1);
  }

  const borderColor = isLive
    ? 'border-white/30 shadow-[0_0_12px_rgba(255,255,255,0.06)]'
    : isDone ? 'border-white/8' : 'border-white/5';

  return (
    <div
      className={`relative rounded-xl border overflow-hidden text-sm select-none transition-all ${borderColor} ${
        !match.team1_id && !match.team2_id ? 'opacity-30' : ''
      }`}
      style={{ width: CARD_W, height: CARD_H }}
    >
      {/* Glow line for live matches */}
      {isLive && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary-500/60 to-transparent" />
      )}

      {/* Header strip */}
      <div className="h-4 px-2 flex items-center justify-between bg-white/[0.025]">
        {isBye && <span className="text-[9px] text-gray-600 uppercase tracking-wider">BYE</span>}
        {isLive && <span className="text-[9px] text-green-400 uppercase tracking-wider ml-auto">LIVE</span>}
      </div>

      {/* Team 1 */}
      <div
        onClick={() => handleTeamClick(match.team1_id, true)}
        className={`h-[30px] px-2 flex items-center gap-1.5 border-b border-white/5 transition-all ${
          isDone && winner?.id === match.team1_id ? 'bg-green-500/10' :
          isDone && match.team1_id ? 'opacity-40' : ''
        } ${canAdmin ? 'cursor-pointer hover:bg-white/[0.06]' : ''}`}
      >
        {match.team1_id && (
          <span className="text-[10px] text-gray-600 w-3">{t1?.seed ?? '?'}</span>
        )}
        <span className={`flex-1 text-xs font-medium truncate ${
          winner?.id === match.team1_id ? 'text-green-300' : 'text-gray-300'
        }`}>
          {t1 ? t1.name : <span className="text-gray-600 italic">TBD</span>}
        </span>
        {isDone && match.team1_id && (
          <span className="text-[10px] text-gray-500 tabular-nums">{match.score1}</span>
        )}
        {winner?.id === match.team1_id && (
          <Trophy className="w-2.5 h-2.5 text-yellow-400 shrink-0" />
        )}
      </div>

      {/* Team 2 */}
      <div
        onClick={() => handleTeamClick(match.team2_id, false)}
        className={`h-[30px] px-2 flex items-center gap-1.5 transition-all ${
          isDone && winner?.id === match.team2_id ? 'bg-green-500/10' :
          isDone && match.team2_id ? 'opacity-40' : ''
        } ${canAdmin ? 'cursor-pointer hover:bg-white/[0.06]' : ''}`}
      >
        {match.team2_id && (
          <span className="text-[10px] text-gray-600 w-3">{t2?.seed ?? '?'}</span>
        )}
        <span className={`flex-1 text-xs font-medium truncate ${
          winner?.id === match.team2_id ? 'text-green-300' : 'text-gray-300'
        }`}>
          {t2 ? t2.name : <span className="text-gray-600 italic">TBD</span>}
        </span>
        {isDone && match.team2_id && (
          <span className="text-[10px] text-gray-500 tabular-nums">{match.score2}</span>
        )}
        {winner?.id === match.team2_id && (
          <Trophy className="w-2.5 h-2.5 text-yellow-400 shrink-0" />
        )}
      </div>

    </div>
  );
}

// ─── Bracket section ──────────────────────────────────────────────────────────
function BracketSection({
  label, labelColor, matches, teams, isCreator, onRequestWinner,
}: {
  label: string; labelColor: string; matches: Match[];
  teams: Team[]; isCreator: boolean;
  onRequestWinner: (match: Match, teamId: number, isTeam1: boolean) => void;
}) {
  if (matches.length === 0) return null;

  const rounds = Array.from(new Set(matches.map(m => m.round))).sort((a, b) => a - b);
  const roundMap: Record<number, Match[]> = {};
  for (const r of rounds) {
    roundMap[r] = matches.filter(m => m.round === r).sort((a, b) => a.match_number - b.match_number);
  }

  const totalRounds = rounds.length;
  const roundToIdx: Record<number, number> = {};
  rounds.forEach((r, i) => { roundToIdx[r] = i; });

  const maxMatchesR1 = roundMap[rounds[0]]?.length ?? 1;
  const totalH = maxMatchesR1 * SLOT_H;
  const totalW = totalRounds * (CARD_W + CONN_W);

  return (
    <div className="mb-8">
      <div className={`text-xs font-bold uppercase tracking-widest mb-3 ${labelColor}`}>{label}</div>
      <div className="overflow-x-auto pb-2">
        <div className="relative" style={{ width: totalW, height: totalH }}>
          {/* SVG connector lines */}
          <svg className="absolute inset-0 pointer-events-none" width={totalW} height={totalH}>
            {rounds.slice(0, -1).map((round, ri) => {
              const nextRound = rounds[ri + 1];
              const nextMatches = roundMap[nextRound] || [];
              return nextMatches.map((_, mi) => {
                const y0 = calcY(ri, mi * 2) + CARD_H / 2;
                const y1 = calcY(ri, mi * 2 + 1) + CARD_H / 2;
                const yNext = calcY(ri + 1, mi) + CARD_H / 2;
                const x0 = ri * (CARD_W + CONN_W) + CARD_W;
                const xMid = x0 + CONN_W / 2;
                const x1 = (ri + 1) * (CARD_W + CONN_W);
                return (
                  <g
                    key={`${round}-${mi}`}
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinecap="round"
                  >
                    <path d={`M ${x0} ${y0} H ${xMid}`} />
                    <path d={`M ${xMid} ${y0} V ${y1}`} />
                    <path d={`M ${x0} ${y1} H ${xMid}`} />
                    <path d={`M ${xMid} ${yNext} H ${x1}`} />
                  </g>
                );
              });
            })}
          </svg>

          {/* Match cards */}
          {rounds.map((round, ri) => (
            (roundMap[round] || []).map((match, mi) => (
              <div
                key={match.id}
                className="absolute"
                style={{ left: ri * (CARD_W + CONN_W), top: calcY(ri, mi), width: CARD_W }}
              >
                {ri === 0 && (
                  <div className="text-[9px] text-gray-600 text-center mb-1 uppercase tracking-wider">
                    {getRoundLabel(ri, totalRounds)}
                  </div>
                )}
                {ri > 0 && mi === 0 && (
                  <div className="text-[9px] text-gray-600 text-center mb-1 uppercase tracking-wider absolute -top-4 left-0 right-0">
                    {getRoundLabel(ri, totalRounds)}
                  </div>
                )}
                <MatchCard
                  match={match}
                  teams={teams}
                  isCreator={isCreator}
                  onRequestWinner={onRequestWinner}
                />
              </div>
            ))
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  if (status === 'registration') {
    return (
      <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border text-blue-400 bg-blue-500/15 border-blue-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
        Pendaftaran
      </span>
    );
  }
  if (status === 'ongoing') {
    return (
      <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border text-green-400 bg-green-500/15 border-green-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        Berlangsung
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border text-gray-400 bg-gray-500/15 border-gray-500/30">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
      Selesai
    </span>
  );
}

// ─── Room Info Card ───────────────────────────────────────────────────────────
function RoomInfoCard({ room_id, room_password }: { room_id?: string; room_password?: string }) {
  const [revealed, setRevealed] = useState(false);

  if (!room_id) {
    return (
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Lock className="w-3.5 h-3.5" /> Info Room
        </p>
        <p className="text-xs text-gray-600 text-center py-2">
          Room belum diset oleh penyelenggara
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4">
      <p className="text-xs text-green-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        <Lock className="w-3.5 h-3.5" /> Info Room
      </p>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 bg-dark-400/60 rounded-lg px-3 py-2">
          <div>
            <p className="text-[10px] text-gray-500 mb-0.5">Room ID</p>
            <p className="text-sm text-white font-mono">{room_id}</p>
          </div>
          <CopyButton text={room_id} />
        </div>
        {room_password && (
          <div className="flex items-center justify-between gap-2 bg-dark-400/60 rounded-lg px-3 py-2">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-gray-500 mb-0.5">Password</p>
              <p className="text-sm text-white font-mono">{revealed ? room_password : '••••••'}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setRevealed(r => !r)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-all"
                title={revealed ? 'Sembunyikan' : 'Tampilkan'}
              >
                {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <CopyButton text={room_password} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function TournamentDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const queryClient = useQueryClient();
  const { token, isAuthenticated } = useAuth();
  const { data: currentUser } = useUser();

  const { data: t, isLoading, error } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => fetchTournament(id),
    refetchInterval: 20000,
  });

  const [joinName, setJoinName] = useState('');
  const [copied, setCopied] = useState(false);
  const [startErr, setStartErr] = useState('');
  const [roomForm, setRoomForm] = useState({ room_id: '', room_password: '' });
  const [roomSaved, setRoomSaved] = useState(false);
  const [winnerModal, setWinnerModal] = useState<{ match: Match; teamId: number; isTeam1: boolean } | null>(null);

  const isCreator = !!currentUser && !!t?.creator_id && String(currentUser.id) === String(t.creator_id);

  useEffect(() => {
    if (t) {
      document.title = `${t.name} - MLBB Hub`;
      // Pre-fill room form when data loads
      setRoomForm({
        room_id: t.room_id ?? '',
        room_password: t.room_password ?? '',
      });
    }
    return () => { document.title = 'MLBB Hub - Mobile Legends: Bang Bang Community Hub'; };
  }, [t]);

  const joinMut = useMutation({
    mutationFn: () => joinTournament(id, joinName, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', id] });
      setJoinName('');
    },
  });

  const startMut = useMutation({
    mutationFn: () => startTournament(id, token!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tournament', id] }),
    onError: (e: Error) => setStartErr(e.message),
  });

  const roomMut = useMutation({
    mutationFn: () => updateRoom(id, roomForm.room_id, roomForm.room_password, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', id] });
      setRoomSaved(true);
      setTimeout(() => setRoomSaved(false), 2500);
    },
  });

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function refresh() { queryClient.invalidateQueries({ queryKey: ['tournament', id] }); }

  if (isLoading) return (
    <div className="min-h-screen bg-dark-400 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (error || !t) return (
    <div className="min-h-screen bg-dark-400 flex items-center justify-center text-red-400">
      Tournament tidak ditemukan
    </div>
  );

  // Group matches
  const winnerMatches = t.matches.filter(m => m.bracket === 'winners' || m.bracket === 'winners_final' || !m.bracket);
  const loserMatches = t.matches.filter(m => m.bracket === 'losers' || m.bracket === 'losers_final');
  const grandFinalMatches = t.matches.filter(m => m.bracket === 'grand_final');
  const isDouble = t.bracket_type === 'double';

  const champion = (() => {
    const lastMatch = t.matches.find(m => !m.next_match_id && !m.loser_next_match_id);
    return lastMatch?.winner_id ? t.teams.find(tm => tm.id === lastMatch.winner_id) : null;
  })();

  const slotsProgress = (t.teams.length / t.team_count) * 100;

  return (
    <div className="min-h-screen bg-dark-400 pb-20">
      {/* ── Hero header ──────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-b from-dark-200/60 to-dark-400 border-b border-white/5">
        <div className="container mx-auto px-4 pt-6 pb-5">
          {/* Breadcrumb */}
          <Link
            to="/tournament"
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-4"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Semua Turnamen
          </Link>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
                <Trophy className="w-7 h-7 text-yellow-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-2xl font-bold text-white">{t.name}</h1>
                  <StatusBadge status={t.status} />
                  {isDouble && (
                    <span className="text-xs px-2 py-0.5 rounded-full border text-purple-400 bg-purple-500/15 border-purple-500/30">
                      Double Elim
                    </span>
                  )}
                </div>
                {t.description && (
                  <p className="text-sm text-gray-400 truncate">{t.description}</p>
                )}
                <p className="text-xs text-gray-600 mt-1">oleh {t.created_by_name}</p>
              </div>
            </div>
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 border border-white/10 rounded-lg hover:text-white hover:border-white/20 transition-all shrink-0"
            >
              {copied
                ? <><Check className="w-3 h-3 text-green-400" /> Disalin!</>
                : <><Copy className="w-3 h-3" /> Salin Link</>}
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">

        {/* ── Champion banner ──────────────────────────────────────────── */}
        {champion && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-6 bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border border-yellow-500/30 text-center"
          >
            <Trophy className="w-10 h-10 text-yellow-400 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Juara Turnamen</p>
            <p className="text-2xl font-bold text-yellow-300 mt-1">{champion.name}</p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* ── Left sidebar ─────────────────────────────────────────────── */}
          <div className="space-y-4 lg:col-span-1">

            {/* Info card (registration phase) */}
            {(t.scheduled_at || t.prize || t.contact || t.rules) && (
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 space-y-3">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Info Turnamen</p>

                {t.scheduled_at && (
                  <div className="flex items-start gap-2">
                    <CalendarDays className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-gray-600 mb-0.5">Jadwal</p>
                      <p className="text-xs text-gray-300 leading-snug">{formatScheduled(t.scheduled_at)}</p>
                    </div>
                  </div>
                )}

                {t.prize && (
                  <div className="flex items-start gap-2">
                    <Gift className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-gray-600 mb-0.5">Hadiah</p>
                      <p className="text-xs text-yellow-300">{t.prize}</p>
                    </div>
                  </div>
                )}

                {t.contact && (
                  <div className="flex items-start gap-2">
                    <MessageCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-gray-600 mb-0.5">Kontak</p>
                      <p className="text-xs text-gray-300 break-all">{t.contact}</p>
                    </div>
                  </div>
                )}

                {/* Slot progress */}
                <div>
                  <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1.5">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Slot Tim</span>
                    <span>{t.teams.length}/{t.team_count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all"
                      style={{ width: `${slotsProgress}%` }}
                    />
                  </div>
                </div>

                {t.rules && (
                  <div>
                    <p className="text-[10px] text-gray-600 mb-1.5 flex items-center gap-1">
                      <ScrollText className="w-3 h-3" /> Peraturan
                    </p>
                    <div className="bg-dark-400/60 rounded-lg px-3 py-2 max-h-32 overflow-y-auto">
                      <p className="text-xs text-gray-400 whitespace-pre-wrap leading-relaxed">{t.rules}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Teams list */}
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Users className="w-3.5 h-3.5" /> Tim ({t.teams.length}/{t.team_count})
              </p>

              {/* Slot progress (if info card not shown) */}
              {!t.scheduled_at && !t.prize && !t.contact && !t.rules && (
                <div className="mb-3">
                  <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all"
                      style={{ width: `${slotsProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {t.teams.length === 0 ? (
                <p className="text-xs text-gray-600 text-center py-3">Belum ada tim</p>
              ) : (
                <div className="space-y-1.5">
                  {t.teams.map((team, i) => (
                    <div key={team.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.03]">
                      <span className="text-xs text-gray-600 w-4 text-right">{team.seed ?? i + 1}</span>
                      <Shield className="w-3 h-3 text-gray-600" />
                      <span className="text-sm text-gray-300 flex-1 truncate">{team.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Join form */}
              {t.status === 'registration' && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  {isAuthenticated ? (
                    <>
                      <p className="text-xs text-gray-500 mb-1">Daftarkan tim kamu</p>
                      <p className="text-[10px] text-gray-600 mb-2">Masukkan nama tim kamu di MLBB</p>
                      <input
                        className="w-full bg-dark-400 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500/50 mb-2 transition-colors"
                        placeholder="Nama Tim"
                        value={joinName}
                        onChange={e => setJoinName(e.target.value)}
                      />
                      {joinMut.error && (
                        <p className="text-red-400 text-xs mb-2">{(joinMut.error as Error).message}</p>
                      )}
                      <button
                        onClick={() => joinMut.mutate()}
                        disabled={!joinName.trim() || joinMut.isPending}
                        className="w-full py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        {joinMut.isPending ? 'Mendaftar...' : 'Daftar Tim'}
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/auth"
                      className="flex items-center justify-center gap-2 w-full py-2 text-sm text-gray-400 border border-white/10 rounded-lg hover:text-white hover:border-white/20 transition-all"
                    >
                      <LogIn className="w-3.5 h-3.5" /> Login untuk daftar
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Room info (ongoing — visible to all) */}
            {t.status === 'ongoing' && (
              <RoomInfoCard room_id={t.room_id} room_password={t.room_password} />
            )}

            {/* Admin / Creator panel */}
            {isCreator && (
              <div className="rounded-2xl border border-primary-500/20 bg-primary-500/5 p-4 space-y-3">
                <p className="text-xs text-primary-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5" /> Panel Pembuat
                </p>

                {t.status === 'registration' && (
                  <>
                    {t.scheduled_at && (
                      <div className="flex items-center gap-2 bg-dark-400/40 rounded-lg px-3 py-2">
                        <CalendarDays className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <p className="text-[10px] text-gray-400 leading-snug">
                          {formatScheduled(t.scheduled_at)}
                        </p>
                      </div>
                    )}
                    {startErr && <p className="text-red-400 text-xs">{startErr}</p>}
                    <button
                      onClick={() => startMut.mutate()}
                      disabled={t.teams.length < 2 || startMut.isPending}
                      className="w-full py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      {startMut.isPending ? 'Memulai...' : 'Mulai Turnamen'}
                    </button>
                    {t.teams.length < 2 && (
                      <p className="text-xs text-gray-600 text-center">Min 2 tim</p>
                    )}
                  </>
                )}

                {t.status === 'ongoing' && (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-400 text-center">
                      Klik nama tim di bracket untuk set pemenang
                    </p>
                    {/* Set Room */}
                    <div className="pt-2 border-t border-white/8 space-y-2">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Atur Room</p>
                      <input
                        className="w-full bg-dark-400 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500/50 transition-colors"
                        placeholder="Room ID"
                        value={roomForm.room_id}
                        onChange={e => setRoomForm(f => ({ ...f, room_id: e.target.value }))}
                      />
                      <input
                        className="w-full bg-dark-400 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500/50 transition-colors"
                        placeholder="Room Password"
                        value={roomForm.room_password}
                        onChange={e => setRoomForm(f => ({ ...f, room_password: e.target.value }))}
                      />
                      {roomMut.error && (
                        <p className="text-red-400 text-xs">{(roomMut.error as Error).message}</p>
                      )}
                      <button
                        onClick={() => roomMut.mutate()}
                        disabled={roomMut.isPending}
                        className="w-full py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                      >
                        {roomSaved
                          ? <><Check className="w-3.5 h-3.5" /> Tersimpan!</>
                          : roomMut.isPending
                            ? 'Menyimpan...'
                            : 'Simpan Room'}
                      </button>
                    </div>
                  </div>
                )}

                {t.status === 'completed' && (
                  <p className="text-xs text-green-400 text-center">Turnamen selesai</p>
                )}
              </div>
            )}
          </div>

          {/* ── Right: Bracket ───────────────────────────────────────────── */}
          <div className="lg:col-span-3">
            {t.status === 'registration' ? (
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-8 text-center text-gray-500">
                <Trophy className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p>Bracket akan tampil setelah turnamen dimulai</p>
                <p className="text-xs mt-1 text-gray-600">{t.teams.length}/{t.team_count} tim terdaftar</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                <BracketSection
                  label={isDouble ? '🏆 Winners Bracket' : 'Bracket'}
                  labelColor={isDouble ? 'text-blue-400' : 'text-gray-400'}
                  matches={winnerMatches}
                  teams={t.teams}
                  isCreator={isCreator}
                  onRequestWinner={(match, teamId, isTeam1) => setWinnerModal({ match, teamId, isTeam1 })}
                />
                {isDouble && loserMatches.length > 0 && (
                  <>
                    <div className="border-t border-white/8 my-4" />
                    <BracketSection
                      label="💀 Losers Bracket"
                      labelColor="text-red-400"
                      matches={loserMatches}
                      teams={t.teams}
                      isCreator={isCreator}
                      onRequestWinner={(match, teamId, isTeam1) => setWinnerModal({ match, teamId, isTeam1 })}
                    />
                  </>
                )}
                {isDouble && grandFinalMatches.length > 0 && (
                  <>
                    <div className="border-t border-white/8 my-4" />
                    <div className="mb-2 text-xs font-bold uppercase tracking-widest text-yellow-400">
                      🎖 Grand Final
                    </div>
                    <div className="flex justify-center">
                      {grandFinalMatches.map(m => (
                        <MatchCard
                          key={m.id}
                          match={m}
                          teams={t.teams}
                          isCreator={isCreator}
                          onRequestWinner={(match, teamId, isTeam1) => setWinnerModal({ match, teamId, isTeam1 })}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Global winner confirmation modal ─────────────────────────────── */}
      <AnimatePresence>
        {winnerModal && (
          <WinnerModal
            match={winnerModal.match}
            teamId={winnerModal.teamId}
            isTeam1={winnerModal.isTeam1}
            teams={t.teams}
            tournamentId={id}
            token={token ?? ''}
            onSuccess={refresh}
            onClose={() => setWinnerModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
