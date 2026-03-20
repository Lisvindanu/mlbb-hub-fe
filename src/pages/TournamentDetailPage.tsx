import { useState, useEffect } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Users, Copy, Check, Play, Shield, LogIn, Settings,
  Gift, CalendarDays, Lock, Eye, EyeOff, MessageCircle, ScrollText,
  ChevronLeft, X, Crown, ChevronDown, ChevronUp, Upload,
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
interface Player { id: number; team_id: number; player_name: string; role: string; is_captain: boolean; game_id?: string; }
interface Team { id: number; name: string; seed: number | null; logo_url?: string; players?: Player[]; team_status?: string; }
interface JoinPlayer { player_name: string; role: string; is_captain: boolean; game_id: string; is_sub: boolean; }
interface Match {
  id: number; round: number; match_number: number; bracket: string;
  team1_id: number | null; team2_id: number | null;
  winner_id: number | null; score1: number; score2: number;
  status: string; next_match_id: number | null; loser_next_match_id: number | null;
}
interface Tournament {
  id: number; name: string; description: string;
  team_count: number; bracket_type: string; status: string;
  bo_format?: string;
  created_by_name: string; created_at: string;
  creator_id?: number | null;
  teams: Team[]; matches: Match[];
  prize?: string;
  rules?: string;
  scheduled_at?: string;
  end_date?: string;
  room_id?: string;
  room_password?: string;
  contact?: string;
  is_paid?: boolean;
  registration_fee?: string;
}

// ─── API helpers ──────────────────────────────────────────────────────────────
async function fetchTournament(id: string): Promise<Tournament> {
  const res = await fetch(`${API_BASE}/api/tournaments/${id}`);
  if (!res.ok) throw new Error('Tournament not found');
  return res.json();
}

async function uploadLogoAsWebp(file: File, token: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = async () => {
      URL.revokeObjectURL(url);
      const maxSize = 256;
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/webp', 0.85);
      try {
        const res = await fetch(`${API_BASE}/api/tournaments/upload-logo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ image: dataUrl }),
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Upload gagal');
        const { url: logoUrl } = await res.json();
        resolve(`${API_BASE}${logoUrl}`);
      } catch (e) { reject(e); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Gagal membaca gambar')); };
    img.src = url;
  });
}

async function joinTournament(id: string, team_name: string, token: string, logo_url?: string, players?: JoinPlayer[]) {
  const res = await fetch(`${API_BASE}/api/tournaments/${id}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ team_name, logo_url, players }),
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
  boFormat: string;
  onSuccess: () => void;
  onClose: () => void;
}
function WinnerModal({ match, teamId, isTeam1, teams, tournamentId, token, boFormat, onSuccess, onClose }: WinnerModalProps) {
  const maxWins = boFormat === 'BO5' ? 3 : boFormat === 'BO1' ? 1 : 2;
  const [scores, setScores] = useState({
    s1: match.score1 || (isTeam1 ? maxWins : 0),
    s2: match.score2 || (isTeam1 ? 0 : maxWins),
  });
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
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500">Set pemenang pertandingan</p>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/25 text-cyan-400 font-bold">
                {boFormat}
              </span>
            </div>
            <p className="text-sm font-semibold text-yellow-300 mt-0.5 truncate">{winnerTeam?.name ?? '?'}</p>
          </div>
        </div>

        {/* BO info */}
        <div className="flex items-center gap-2 bg-dark-400/40 rounded-lg px-3 py-2 mb-4">
          <span className="text-xs text-gray-500">
            {boFormat === 'BO1' ? 'Single game — menang 1 kali' :
             boFormat === 'BO3' ? 'First to 2 wins (max 3 game)' :
             'First to 3 wins (max 5 game)'}
          </span>
        </div>

        {/* Score inputs */}
        <div className="bg-dark-400/60 rounded-xl p-4 mb-4">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-3">
            Skor Akhir (jumlah game menang)
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 text-center">
              <p className={`text-[11px] mb-1.5 truncate font-medium ${isTeam1 ? 'text-yellow-300' : 'text-gray-400'}`}>
                {t1?.name ?? 'Tim 1'}
              </p>
              <input
                type="number"
                min={0}
                max={maxWins}
                value={scores.s1}
                onChange={e => setScores(s => ({ ...s, s1: Math.min(maxWins, Math.max(0, Number(e.target.value))) }))}
                className={`w-full text-center bg-dark-500 border rounded-lg text-white text-xl font-bold py-2 focus:outline-none transition-colors ${
                  isTeam1 ? 'border-yellow-500/40 focus:border-yellow-400/60' : 'border-white/15 focus:border-primary-500/50'
                }`}
              />
            </div>
            <span className="text-gray-600 font-bold text-lg">:</span>
            <div className="flex-1 text-center">
              <p className={`text-[11px] mb-1.5 truncate font-medium ${!isTeam1 ? 'text-yellow-300' : 'text-gray-400'}`}>
                {t2?.name ?? 'Tim 2'}
              </p>
              <input
                type="number"
                min={0}
                max={maxWins}
                value={scores.s2}
                onChange={e => setScores(s => ({ ...s, s2: Math.min(maxWins, Math.max(0, Number(e.target.value))) }))}
                className={`w-full text-center bg-dark-500 border rounded-lg text-white text-xl font-bold py-2 focus:outline-none transition-colors ${
                  !isTeam1 ? 'border-yellow-500/40 focus:border-yellow-400/60' : 'border-white/15 focus:border-primary-500/50'
                }`}
              />
            </div>
          </div>
          <p className="text-[10px] text-gray-600 text-center mt-2">Skor pemenang max: {maxWins}</p>
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

// ─── MLBB lane roles ──────────────────────────────────────────────────────────
const MAIN_ROLES = ['Roamer', 'Jungler', 'Mid Lane', 'EXP Lane', 'Gold Lane'];

const ROLE_COLOR: Record<string, string> = {
  Roamer: 'text-blue-400',
  Jungler: 'text-green-400',
  'Mid Lane': 'text-purple-400',
  'EXP Lane': 'text-orange-400',
  'Gold Lane': 'text-yellow-400',
  Cadangan: 'text-gray-500',
};

function TeamAvatar({ name, logoUrl, size = 'md' }: { name: string; logoUrl?: string; size?: 'sm' | 'md' }) {
  const [imgErr, setImgErr] = useState(false);
  const cls = size === 'sm'
    ? 'w-7 h-7 rounded-lg text-xs font-bold'
    : 'w-10 h-10 rounded-xl text-sm font-bold';
  if (logoUrl && !imgErr) {
    return (
      <img
        src={logoUrl}
        alt={name}
        onError={() => setImgErr(true)}
        className={`${cls} object-cover border border-white/10 shrink-0`}
      />
    );
  }
  const initial = name.charAt(0).toUpperCase();
  const colors = ['bg-primary-500/30 text-primary-300', 'bg-yellow-500/30 text-yellow-300', 'bg-green-500/30 text-green-300', 'bg-purple-500/30 text-purple-300', 'bg-red-500/30 text-red-300'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`${cls} ${color} flex items-center justify-center border border-white/10 shrink-0`}>
      {initial}
    </div>
  );
}

// ─── Join modal ───────────────────────────────────────────────────────────────
function JoinModal({ tournamentId, token, onSuccess, onClose }: {
  tournamentId: string; token: string; onSuccess: () => void; onClose: () => void;
}) {
  const EMPTY_PLAYERS: JoinPlayer[] = [
    ...Array.from({ length: 5 }, (_, i) => ({ player_name: '', role: MAIN_ROLES[i], is_captain: i === 0, game_id: '', is_sub: false })),
    ...Array.from({ length: 2 }, () => ({ player_name: '', role: 'Cadangan', is_captain: false, game_id: '', is_sub: true })),
  ];

  const [teamName, setTeamName] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [players, setPlayers] = useState<JoinPlayer[]>(EMPTY_PLAYERS);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  function updatePlayer(i: number, field: keyof JoinPlayer, value: string | boolean) {
    setPlayers(ps => ps.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  }

  function setCaptain(i: number) {
    setPlayers(ps => ps.map((p, idx) => ({ ...p, is_captain: idx === i })));
  }

  async function submit() {
    if (!teamName.trim()) { setErr('Nama tim wajib diisi'); return; }
    setLoading(true);
    setErr('');
    try {
      let finalLogoUrl: string | undefined;
      if (logoFile) {
        finalLogoUrl = await uploadLogoAsWebp(logoFile, token);
      }
      const activePlayers = players.filter(p => p.player_name.trim());
      await joinTournament(tournamentId, teamName.trim(), token, finalLogoUrl, activePlayers.length > 0 ? activePlayers : undefined);
      onSuccess();
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 16 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="bg-dark-300 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl flex flex-col"
        style={{ maxHeight: 'calc(100vh - 2rem)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/8 shrink-0">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary-400" />
            Daftarkan Tim
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Identitas Tim */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Identitas Tim</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Nama Tim *</label>
                <input
                  className="w-full bg-dark-400 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-primary-500/50 transition-colors"
                  placeholder="Nama tim kamu di MLBB"
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">
                  Logo Tim <span className="text-gray-600">(opsional, otomatis dikonversi ke webp)</span>
                </label>
                <div className="flex gap-3 items-center">
                  <label className="flex-1 flex items-center gap-2 bg-dark-400 border border-white/10 rounded-xl px-3 py-2.5 cursor-pointer hover:border-primary-500/50 transition-colors">
                    <Upload className="w-4 h-4 text-gray-500 shrink-0" />
                    <span className="text-sm text-gray-500 truncate">
                      {logoFile ? logoFile.name : 'Pilih gambar...'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setLogoFile(f);
                        setLogoPreview(URL.createObjectURL(f));
                      }}
                    />
                  </label>
                  {logoPreview ? (
                    <div className="relative shrink-0">
                      <img src={logoPreview} alt="preview" className="w-12 h-12 rounded-xl object-cover border border-white/15" />
                      <button
                        type="button"
                        onClick={() => { setLogoFile(null); setLogoPreview(''); }}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-dark-200 border border-white/20 rounded-full flex items-center justify-center hover:bg-red-500/30"
                      >
                        <X className="w-2.5 h-2.5 text-gray-400" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-dark-400 border border-white/10 flex items-center justify-center shrink-0">
                      <Shield className="w-5 h-5 text-gray-600" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Data Pemain */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
              Data Pemain <span className="normal-case font-normal text-gray-600">(opsional)</span>
            </p>
            <p className="text-[10px] text-gray-600 mb-3">Klik <Crown className="w-2.5 h-2.5 inline mb-0.5" /> untuk tandai captain • ID In-Game untuk distribusi hadiah</p>

            {/* Main players */}
            <div className="space-y-2 mb-3">
              {players.filter(p => !p.is_sub).map((p, i) => {
                const takenRoles = players.filter((pp, ii) => !pp.is_sub && ii !== i && pp.role).map(pp => pp.role);
                const availableRoles = MAIN_ROLES.filter(r => !takenRoles.includes(r));
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => setCaptain(i)}
                        title="Tandai captain"
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                          p.is_captain
                            ? 'bg-yellow-500/20 border border-yellow-500/40 text-yellow-400'
                            : 'bg-dark-400/60 border border-white/8 text-gray-600 hover:text-yellow-500/60'
                        }`}
                      >
                        <Crown className="w-3 h-3" />
                      </button>
                      <input
                        className="flex-1 min-w-0 bg-dark-400 border border-white/10 rounded-lg px-2.5 py-1.5 text-white placeholder-gray-600 text-xs focus:outline-none focus:border-primary-500/50 transition-colors"
                        placeholder={`Pemain ${i + 1} (IGN)`}
                        value={p.player_name}
                        onChange={e => updatePlayer(i, 'player_name', e.target.value)}
                      />
                      <select
                        value={p.role}
                        onChange={e => updatePlayer(i, 'role', e.target.value)}
                        className="w-28 bg-dark-400 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-primary-500/50 transition-colors shrink-0"
                      >
                        <option value="">Lane/Role</option>
                        {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                        {p.role && !availableRoles.includes(p.role) && <option value={p.role}>{p.role}</option>}
                      </select>
                    </div>
                    <div className="flex gap-2 pl-9">
                      <input
                        className="flex-1 bg-dark-500 border border-white/8 rounded-lg px-2.5 py-1 text-gray-300 placeholder-gray-700 text-[11px] focus:outline-none focus:border-primary-500/30 transition-colors"
                        placeholder="ID In-Game (opsional, untuk hadiah)"
                        value={p.game_id}
                        onChange={e => updatePlayer(i, 'game_id', e.target.value)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Substitute players */}
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Cadangan (opsional)</p>
            <div className="space-y-2">
              {players.map((p, i) => !p.is_sub ? null : (
                <div key={i} className="space-y-1">
                  <div className="flex gap-2 items-center">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-dark-400/40 border border-white/5 shrink-0">
                      <span className="text-[9px] text-gray-600 font-bold">SUB</span>
                    </div>
                    <input
                      className="flex-1 min-w-0 bg-dark-400 border border-white/10 rounded-lg px-2.5 py-1.5 text-white placeholder-gray-600 text-xs focus:outline-none focus:border-primary-500/50 transition-colors"
                      placeholder={`Cadangan ${i - 4} (IGN)`}
                      value={p.player_name}
                      onChange={e => updatePlayer(i, 'player_name', e.target.value)}
                    />
                    <span className="w-28 text-[10px] text-gray-600 text-center shrink-0">Cadangan</span>
                  </div>
                  <div className="flex gap-2 pl-9">
                    <input
                      className="flex-1 bg-dark-500 border border-white/8 rounded-lg px-2.5 py-1 text-gray-300 placeholder-gray-700 text-[11px] focus:outline-none focus:border-primary-500/30 transition-colors"
                      placeholder="ID In-Game (opsional)"
                      value={p.game_id}
                      onChange={e => updatePlayer(i, 'game_id', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {err && <p className="text-red-400 text-xs">{err}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-4 border-t border-white/8 shrink-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 text-sm transition-all"
          >
            Batal
          </button>
          <button
            onClick={submit}
            disabled={!teamName.trim() || loading}
            className="flex-1 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all"
          >
            {loading
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><Shield className="w-3.5 h-3.5" /> Daftar Tim</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Team list with expandable roster ────────────────────────────────────────
function TeamList({ teams, tournamentId, isCreator, isPaid, token, onRefresh }: {
  teams: Team[]; tournamentId: string; isCreator: boolean; isPaid: boolean; token: string | null; onRefresh: () => void;
}) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  async function handleStatus(teamId: number, status: 'approved' | 'rejected') {
    setLoadingId(teamId);
    try {
      await fetch(`${API_BASE}/api/tournaments/${tournamentId}/teams/${teamId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      onRefresh();
    } finally { setLoadingId(null); }
  }

  async function handleDelete(teamId: number, teamName: string) {
    if (!confirm(`Hapus tim "${teamName}"?`)) return;
    setLoadingId(teamId);
    try {
      await fetch(`${API_BASE}/api/tournaments/${tournamentId}/teams/${teamId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      onRefresh();
    } finally { setLoadingId(null); }
  }

  return (
    <div className="space-y-1.5">
      {teams.map((team, i) => {
        const isExpanded = expandedId === team.id;
        const hasPlayers = (team.players?.length ?? 0) > 0;
        const captain = team.players?.find(p => p.is_captain);

        const isPending = team.team_status === 'pending';
        const isRejected = team.team_status === 'rejected';
        return (
          <div key={team.id} className={`rounded-lg overflow-hidden ${isPending ? 'bg-orange-500/5 border border-orange-500/15' : isRejected ? 'bg-red-500/5 border border-red-500/15 opacity-60' : 'bg-white/[0.03]'}`}>
            <div
              className={`flex items-center gap-2 px-2 py-1.5 ${hasPlayers ? 'cursor-pointer hover:bg-white/[0.05]' : ''} transition-all`}
              onClick={() => hasPlayers && setExpandedId(isExpanded ? null : team.id)}
            >
              <span className="text-xs text-gray-600 w-4 text-right shrink-0">{team.seed ?? i + 1}</span>
              <TeamAvatar name={team.name} logoUrl={team.logo_url} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-gray-300 truncate">{team.name}</span>
                  {isPending && <span className="text-[9px] bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded-full shrink-0">Pending</span>}
                  {isRejected && <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full shrink-0">Ditolak</span>}
                </div>
                {captain && (
                  <span className="text-[10px] text-gray-600 truncate">
                    <Crown className="w-2 h-2 inline mr-0.5 text-yellow-600" />{captain.player_name}
                  </span>
                )}
              </div>
              {/* Admin controls */}
              {isCreator && (
                <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                  {isPaid && isPending && (
                    <>
                      <button
                        disabled={loadingId === team.id}
                        onClick={() => handleStatus(team.id, 'approved')}
                        className="text-[10px] bg-green-500/20 hover:bg-green-500/30 text-green-300 px-2 py-0.5 rounded-full transition-colors"
                      >✓ Acc</button>
                      <button
                        disabled={loadingId === team.id}
                        onClick={() => handleStatus(team.id, 'rejected')}
                        className="text-[10px] bg-red-500/20 hover:bg-red-500/30 text-red-300 px-2 py-0.5 rounded-full transition-colors"
                      >✕ Tolak</button>
                    </>
                  )}
                  {isPaid && isRejected && (
                    <button
                      disabled={loadingId === team.id}
                      onClick={() => handleStatus(team.id, 'approved')}
                      className="text-[10px] bg-green-500/20 hover:bg-green-500/30 text-green-300 px-2 py-0.5 rounded-full transition-colors"
                    >↩ Acc</button>
                  )}
                  <button
                    disabled={loadingId === team.id}
                    onClick={() => handleDelete(team.id, team.name)}
                    className="text-[10px] bg-white/5 hover:bg-red-500/20 text-gray-600 hover:text-red-400 px-1.5 py-0.5 rounded-full transition-colors"
                  >🗑</button>
                </div>
              )}
              {hasPlayers && !isCreator && (
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] text-gray-600">{team.players!.length}p</span>
                  {isExpanded ? <ChevronUp className="w-3 h-3 text-gray-600" /> : <ChevronDown className="w-3 h-3 text-gray-600" />}
                </div>
              )}
              {hasPlayers && isCreator && (
                <div className="shrink-0">
                  {isExpanded ? <ChevronUp className="w-3 h-3 text-gray-600" /> : <ChevronDown className="w-3 h-3 text-gray-600" />}
                </div>
              )}
            </div>

            <AnimatePresence>
              {isExpanded && hasPlayers && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-2 pt-1 space-y-1 border-t border-white/5">
                    {team.players!.map(p => (
                      <div key={p.id} className="flex items-center gap-2">
                        {p.is_captain && <Crown className="w-2.5 h-2.5 text-yellow-500 shrink-0" />}
                        {!p.is_captain && <div className="w-2.5" />}
                        <div className="flex-1 min-w-0">
                          <span className="text-xs text-gray-300 truncate block">{p.player_name}</span>
                          {p.game_id && (
                            <span className="text-[10px] text-gray-600 truncate block">ID: {p.game_id}</span>
                          )}
                        </div>
                        {p.role && (
                          <span className={`text-[10px] shrink-0 ${ROLE_COLOR[p.role] ?? 'text-gray-500'}`}>
                            {p.role}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
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

  const [showJoinModal, setShowJoinModal] = useState(false);
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
                  {t.bo_format && (
                    <span className="text-xs px-2 py-0.5 rounded-full border text-cyan-400 bg-cyan-500/10 border-cyan-500/25 font-semibold">
                      {t.bo_format}
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

        <div className={`grid grid-cols-1 gap-6 ${isDouble && t.status !== 'registration' ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
          {/* ── Left sidebar ─────────────────────────────────────────────── */}
          <div className="space-y-4 lg:col-span-1">

            {/* Info card (registration phase) */}
            {(t.scheduled_at || t.prize || t.contact || t.rules || t.bo_format || t.is_paid !== undefined) && (
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 space-y-3">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Info Turnamen</p>

                {/* Paid/Free badge */}
                <div className={`flex items-center justify-between rounded-lg px-3 py-2 ${t.is_paid ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-green-500/10 border border-green-500/20'}`}>
                  <span className="text-xs text-gray-400">Registrasi</span>
                  <span className={`text-sm font-bold ${t.is_paid ? 'text-orange-300' : 'text-green-300'}`}>
                    {t.is_paid ? `💰 Berbayar` : '✓ Gratis'}
                  </span>
                </div>
                {t.is_paid && t.registration_fee && (
                  <div className="flex items-start gap-2">
                    <div>
                      <p className="text-[10px] text-gray-600 mb-0.5">Biaya Registrasi</p>
                      <p className="text-xs text-orange-200/80">{t.registration_fee}</p>
                    </div>
                  </div>
                )}

                {t.bo_format && (
                  <div className="flex items-center justify-between bg-dark-400/50 rounded-lg px-3 py-2">
                    <span className="text-xs text-gray-400">Format Game</span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-cyan-300">{t.bo_format}</span>
                      <span className="text-[10px] text-gray-500 ml-1.5">
                        {t.bo_format === 'BO1' ? '(1 game)' : t.bo_format === 'BO3' ? '(first to 2)' : '(first to 3)'}
                      </span>
                    </div>
                  </div>
                )}

                {t.scheduled_at && (
                  <div className="flex items-start gap-2">
                    <CalendarDays className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-gray-600 mb-0.5">Jadwal Mulai</p>
                      <p className="text-xs text-gray-300 leading-snug">{formatScheduled(t.scheduled_at)}</p>
                    </div>
                  </div>
                )}

                {t.end_date && (
                  <div className="flex items-start gap-2">
                    <CalendarDays className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-gray-600 mb-0.5">Estimasi Selesai</p>
                      <p className="text-xs text-gray-300 leading-snug">{formatScheduled(t.end_date)}</p>
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
                <TeamList teams={t.teams} tournamentId={id} isCreator={isCreator} isPaid={!!t.is_paid} token={token} onRefresh={refresh} />
              )}

              {/* Join form */}
              {t.status === 'registration' && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  {isAuthenticated ? (
                    <button
                      onClick={() => setShowJoinModal(true)}
                      className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <Shield className="w-3.5 h-3.5" /> Daftarkan Tim
                    </button>
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
          <div className={isDouble && t.status !== 'registration' ? 'lg:col-span-4' : 'lg:col-span-3'}>
            {t.status === 'registration' ? (
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-8 text-center text-gray-500">
                <Trophy className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p>Bracket akan tampil setelah turnamen dimulai</p>
                <p className="text-xs mt-1 text-gray-600">{t.teams.length}/{t.team_count} tim terdaftar</p>
              </div>
            ) : isDouble ? (
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 space-y-4">
                {/* Winners + Losers side by side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <BracketSection
                      label="🏆 Winners Bracket"
                      labelColor="text-blue-400"
                      matches={winnerMatches}
                      teams={t.teams}
                      isCreator={isCreator}
                      onRequestWinner={(match, teamId, isTeam1) => setWinnerModal({ match, teamId, isTeam1 })}
                    />
                  </div>
                  {loserMatches.length > 0 && (
                    <div>
                      <BracketSection
                        label="💀 Losers Bracket"
                        labelColor="text-red-400"
                        matches={loserMatches}
                        teams={t.teams}
                        isCreator={isCreator}
                        onRequestWinner={(match, teamId, isTeam1) => setWinnerModal({ match, teamId, isTeam1 })}
                      />
                    </div>
                  )}
                </div>
                {grandFinalMatches.length > 0 && (
                  <>
                    <div className="border-t border-white/8" />
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
            ) : (
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                <BracketSection
                  label="Bracket"
                  labelColor="text-gray-400"
                  matches={winnerMatches}
                  teams={t.teams}
                  isCreator={isCreator}
                  onRequestWinner={(match, teamId, isTeam1) => setWinnerModal({ match, teamId, isTeam1 })}
                />
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
            boFormat={t.bo_format ?? 'BO3'}
            onSuccess={refresh}
            onClose={() => setWinnerModal(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Join modal ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showJoinModal && (
          <JoinModal
            tournamentId={id}
            token={token ?? ''}
            onSuccess={refresh}
            onClose={() => setShowJoinModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
