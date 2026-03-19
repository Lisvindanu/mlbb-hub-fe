import { useState, useEffect } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trophy, Users, Copy, Check, Play, Shield, LogIn, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../hooks/useUser';

const API_BASE = import.meta.env.DEV ? '' : 'https://mlbbapi.project-n.site';

// ─── Layout constants ─────────────────────────────────────────────────────────
const CARD_H = 80;
const CARD_W = 188;
const CONN_W = 48;
const SLOT_GAP = 20; // between non-paired slots at R1 level
const SLOT_H = CARD_H + SLOT_GAP; // 100px per slot

function calcY(roundIdx: number, matchIdx: number): number {
  const factor = Math.pow(2, roundIdx);
  return matchIdx * SLOT_H * factor + (SLOT_H * factor - CARD_H) / 2;
}

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
  teams: Team[]; matches: Match[];
}

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

async function setWinner(id: string, match_id: number, winner_id: number, token: string, score1: number, score2: number) {
  const res = await fetch(`${API_BASE}/api/tournaments/${id}/matches/${match_id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ winner_id, score1, score2 }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

function getRoundLabel(roundIdx: number, totalRounds: number): string {
  const fromEnd = totalRounds - 1 - roundIdx;
  if (fromEnd === 0) return 'Final';
  if (fromEnd === 1) return 'Semifinal';
  if (fromEnd === 2) return 'Perempat Final';
  return `Ronde ${roundIdx + 1}`;
}

// ─── Match Card ───────────────────────────────────────────────────────────────
function MatchCard({
  match, teams, isCreator, token, tournamentId, onUpdated,
}: {
  match: Match; teams: Team[]; isCreator: boolean; token: string; tournamentId: string; onUpdated: () => void;
}) {
  const [scores, setScores] = useState({ s1: match.score1 || 0, s2: match.score2 || 0 });
  const [err, setErr] = useState('');

  const t1 = teams.find(t => t.id === match.team1_id);
  const t2 = teams.find(t => t.id === match.team2_id);
  const winner = teams.find(t => t.id === match.winner_id);

  const isBye = match.status === 'bye';
  const isDone = match.status === 'completed' || isBye;
  const isLive = !isDone && !!match.team1_id && !!match.team2_id;
  const canAdmin = isLive && isCreator;

  async function pick(winnerId: number) {
    if (!canAdmin) return;
    setErr('');
    try {
      await setWinner(tournamentId, match.id, winnerId, token, scores.s1, scores.s2);
      onUpdated();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error');
    }
  }

  const borderColor = isDone ? 'border-white/8' : isLive ? 'border-white/20' : 'border-white/5';

  return (
    <div
      className={`rounded-xl border overflow-hidden text-sm select-none ${borderColor} ${!match.team1_id && !match.team2_id ? 'opacity-30' : ''}`}
      style={{ width: CARD_W, height: CARD_H }}
    >
      {/* header */}
      <div className="h-4 px-2 flex items-center justify-between bg-white/[0.025]">
        {isBye && <span className="text-[9px] text-gray-600 uppercase tracking-wider">BYE</span>}
      </div>

      {/* Team 1 */}
      <div
        onClick={() => pick(match.team1_id!)}
        className={`h-[30px] px-2 flex items-center gap-1.5 border-b border-white/5 transition-all ${
          isDone && winner?.id === match.team1_id ? 'bg-green-500/10' :
          isDone && match.team1_id ? 'opacity-40' : ''
        } ${canAdmin ? 'cursor-pointer hover:bg-white/[0.06]' : ''}`}
      >
        {match.team1_id && <span className="text-[10px] text-gray-600 w-3">{t1?.seed ?? '?'}</span>}
        <span className={`flex-1 text-xs font-medium truncate ${
          winner?.id === match.team1_id ? 'text-green-300' : 'text-gray-300'
        }`}>
          {t1 ? t1.name : <span className="text-gray-600 italic">TBD</span>}
        </span>
        {isDone && match.team1_id && (
          <span className="text-[10px] text-gray-500 tabular-nums">{match.score1}</span>
        )}
        {winner?.id === match.team1_id && <Trophy className="w-2.5 h-2.5 text-yellow-400 shrink-0" />}
      </div>

      {/* Team 2 */}
      <div
        onClick={() => pick(match.team2_id!)}
        className={`h-[30px] px-2 flex items-center gap-1.5 transition-all ${
          isDone && winner?.id === match.team2_id ? 'bg-green-500/10' :
          isDone && match.team2_id ? 'opacity-40' : ''
        } ${canAdmin ? 'cursor-pointer hover:bg-white/[0.06]' : ''}`}
      >
        {match.team2_id && <span className="text-[10px] text-gray-600 w-3">{t2?.seed ?? '?'}</span>}
        <span className={`flex-1 text-xs font-medium truncate ${
          winner?.id === match.team2_id ? 'text-green-300' : 'text-gray-300'
        }`}>
          {t2 ? t2.name : <span className="text-gray-600 italic">TBD</span>}
        </span>
        {isDone && match.team2_id && (
          <span className="text-[10px] text-gray-500 tabular-nums">{match.score2}</span>
        )}
        {winner?.id === match.team2_id && <Trophy className="w-2.5 h-2.5 text-yellow-400 shrink-0" />}
      </div>

      {/* Score input strip */}
      {canAdmin && (
        <div className="absolute bottom-0 left-0 right-0 h-0 overflow-visible z-10">
          <div className="absolute bottom-1 left-0 right-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 pointer-events-none">
            {/* intentionally hidden — scores set via state */}
          </div>
        </div>
      )}

      {err && <div className="px-2 text-[10px] text-red-400 truncate">{err}</div>}
    </div>
  );
}

// ─── Bracket section (single elimination style) ────────────────────────────────
function BracketSection({
  label, labelColor, matches, teams, isCreator, token, tournamentId, onUpdated,
}: {
  label: string; labelColor: string; matches: Match[];
  teams: Team[]; isCreator: boolean; token: string; tournamentId: string; onUpdated: () => void;
}) {
  if (matches.length === 0) return null;

  const rounds = Array.from(new Set(matches.map(m => m.round))).sort((a, b) => a - b);
  const roundMap: Record<number, Match[]> = {};
  for (const r of rounds) roundMap[r] = matches.filter(m => m.round === r).sort((a, b) => a.match_number - b.match_number);

  const totalRounds = rounds.length;

  // For relative indexing within this section
  const roundToIdx: Record<number, number> = {};
  rounds.forEach((r, i) => { roundToIdx[r] = i; });

  // Container height based on max matches in first round
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
                  <g key={`${round}-${mi}`} stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" fill="none" strokeLinecap="round">
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
                style={{
                  left: ri * (CARD_W + CONN_W),
                  top: calcY(ri, mi),
                  width: CARD_W,
                }}
              >
                {ri === 0 && (
                  <div className="text-[9px] text-gray-600 text-center mb-1 uppercase tracking-wider">
                    {getRoundLabel(ri, totalRounds)}
                  </div>
                )}
                {ri > 0 && mi === 0 && (
                  <div
                    className="text-[9px] text-gray-600 text-center mb-1 uppercase tracking-wider absolute -top-4 left-0 right-0"
                  >
                    {getRoundLabel(ri, totalRounds)}
                  </div>
                )}
                <MatchCard
                  match={match}
                  teams={teams}
                  isCreator={isCreator}
                  token={token}
                  tournamentId={tournamentId}
                  onUpdated={onUpdated}
                />
              </div>
            ))
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Score input modal ─────────────────────────────────────────────────────────
// (inline in admin panel)

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
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);

  // Creator detection: compare user id (string) with tournament creator_id (number)
  const isCreator = !!currentUser && !!t?.creator_id && String(currentUser.id) === String(t.creator_id);

  useEffect(() => {
    if (t) document.title = `${t.name} - MLBB Hub`;
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

  // Group matches by bracket type
  const winnerMatches = t.matches.filter(m => m.bracket === 'winners' || m.bracket === 'winners_final' || (!m.bracket));
  const loserMatches = t.matches.filter(m => m.bracket === 'losers' || m.bracket === 'losers_final');
  const grandFinalMatches = t.matches.filter(m => m.bracket === 'grand_final');
  const isDouble = t.bracket_type === 'double';

  const champion = (() => {
    const lastMatch = t.matches.find(m => !m.next_match_id && !m.loser_next_match_id);
    return lastMatch?.winner_id ? t.teams.find(tm => tm.id === lastMatch.winner_id) : null;
  })();

  return (
    <div className="min-h-screen bg-dark-400 pb-20">
      {/* Sticky header */}
      <div className="border-b border-white/5 bg-dark-400/80 backdrop-blur sticky top-16 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <Trophy className="w-5 h-5 text-yellow-400 shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-white truncate">{t.name}</h1>
                <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${
                  t.status === 'registration' ? 'text-blue-400 bg-blue-500/15 border-blue-500/30' :
                  t.status === 'ongoing' ? 'text-green-400 bg-green-500/15 border-green-500/30' :
                  'text-gray-400 bg-gray-500/15 border-gray-500/30'
                }`}>
                  {t.status === 'registration' ? 'Pendaftaran' : t.status === 'ongoing' ? 'Berlangsung' : 'Selesai'}
                </span>
                {isDouble && (
                  <span className="text-xs px-2 py-0.5 rounded-full border text-purple-400 bg-purple-500/15 border-purple-500/30 shrink-0">
                    Double Elim
                  </span>
                )}
              </div>
              {t.description && <p className="text-xs text-gray-500 truncate">{t.description}</p>}
            </div>
          </div>
          <button onClick={copyLink} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 border border-white/10 rounded-lg hover:text-white hover:border-white/20 transition-all shrink-0">
            {copied ? <><Check className="w-3 h-3 text-green-400" /> Disalin!</> : <><Copy className="w-3 h-3" /> Salin Link</>}
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Champion */}
        {champion && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-6 bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border border-yellow-500/30 text-center">
            <Trophy className="w-10 h-10 text-yellow-400 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Juara Turnamen</p>
            <p className="text-2xl font-bold text-yellow-300 mt-1">{champion.name}</p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left: teams + admin */}
          <div className="space-y-4">
            {/* Teams */}
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Users className="w-3.5 h-3.5" /> Tim ({t.teams.length}/{t.team_count})
              </p>
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
                      <p className="text-xs text-gray-500 mb-2">Daftarkan tim kamu</p>
                      <input
                        className="w-full bg-dark-400 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500/50 mb-2"
                        placeholder="Nama tim"
                        value={joinName}
                        onChange={e => setJoinName(e.target.value)}
                      />
                      {joinMut.error && <p className="text-red-400 text-xs mb-2">{(joinMut.error as Error).message}</p>}
                      <button
                        onClick={() => joinMut.mutate()}
                        disabled={!joinName.trim() || joinMut.isPending}
                        className="w-full py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        {joinMut.isPending ? 'Mendaftar...' : 'Daftar Tim'}
                      </button>
                    </>
                  ) : (
                    <Link to="/auth" className="flex items-center justify-center gap-2 w-full py-2 text-sm text-gray-400 border border-white/10 rounded-lg hover:text-white hover:border-white/20 transition-all">
                      <LogIn className="w-3.5 h-3.5" /> Login untuk daftar
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Admin panel — hanya tampil ke pembuat */}
            {isCreator && (
              <div className="rounded-2xl border border-primary-500/20 bg-primary-500/5 p-4">
                <p className="text-xs text-primary-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5" /> Panel Pembuat
                </p>
                {t.status === 'registration' && (
                  <>
                    {startErr && <p className="text-red-400 text-xs mb-2">{startErr}</p>}
                    <button
                      onClick={() => startMut.mutate()}
                      disabled={t.teams.length < 2 || startMut.isPending}
                      className="w-full py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      {startMut.isPending ? 'Memulai...' : 'Mulai Turnamen'}
                    </button>
                    {t.teams.length < 2 && <p className="text-xs text-gray-600 mt-1.5 text-center">Min 2 tim</p>}
                  </>
                )}
                {t.status === 'ongoing' && (
                  <p className="text-xs text-gray-400 text-center">Klik nama tim di bracket untuk set pemenang</p>
                )}
                {t.status === 'completed' && (
                  <p className="text-xs text-green-400 text-center">Turnamen selesai</p>
                )}
              </div>
            )}
          </div>

          {/* Right: Bracket */}
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
                  token={token ?? ''}
                  tournamentId={id}
                  onUpdated={refresh}
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
                      token={token ?? ''}
                      tournamentId={id}
                      onUpdated={refresh}
                    />
                  </>
                )}
                {isDouble && grandFinalMatches.length > 0 && (
                  <>
                    <div className="border-t border-white/8 my-4" />
                    <div className="mb-2 text-xs font-bold uppercase tracking-widest text-yellow-400">🎖 Grand Final</div>
                    <div className="flex justify-center">
                      {grandFinalMatches.map(m => (
                        <MatchCard
                          key={m.id}
                          match={m}
                          teams={t.teams}
                          isCreator={isCreator}
                          token={token ?? ''}
                          tournamentId={id}
                          onUpdated={refresh}
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
    </div>
  );
}
