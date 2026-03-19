import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loading } from '../components/ui/Loading';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Calendar,
  ChevronRight,
  Zap,
  X,
  Shield,
  BarChart2,
  Wrench,
} from 'lucide-react';

const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:8090' : 'https://mlbbapi.project-n.site';

// Resolve icon URL — local /images/ paths need API base prepended
function resolveUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('/')) return `${API_BASE_URL}${url}`;
  return url;
}

function cleanWiki(text: string): string {
  if (!text) return '';
  return text
    .replace(/\{\{ai\|[^|{}]*\|([^|{}]*)\}\}/g, '$1')
    .replace(/\{\{TextID\|([^|}]*)\}\}/g, '[$1]')
    .replace(/\{\{[^{}]*\}\}/g, '')
    .replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, '$2')
    .replace(/'{2,3}(.*?)'{2,3}/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

interface HeroChange {
  hero: string;
  type: string;
  note: string;
  changes: string;
}

interface Patch {
  version: string;
  releaseDate: string | null;
  heroCount: number;
  heroes: HeroChange[];
}

interface SkillInfo {
  skillName: string;
  skillImg: string;
}

interface HeroIconInfo {
  icon: string | null;
  skills: SkillInfo[];
}

type HeroIconMap = Record<string, HeroIconInfo>;

// Parse changes text into skill/section blocks
interface SkillSection {
  sectionType: string; // "Passive" | "Skill 1" | "Ultimate" | "Attributes" | "Others" | ""
  name: string;
  tag: string;
  body: string;
}

const SECTION_RE = /^(Passive|Skill\s*\d+|Ultimate|Attributes|Others)\s*[-–]\s*([^\n\[]*?)(\s*\[(?:Buff|Nerf|Adjust|Revamp|buff|nerf|adjust|revamp)\])?\s*$/;

function parseSkillSections(raw: string): SkillSection[] {
  const lines = cleanWiki(raw).split('\n');
  const sections: SkillSection[] = [];
  let current: SkillSection | null = null;
  const bodyLines: string[] = [];

  const flush = () => {
    if (current) {
      current.body = bodyLines.join('\n').trim();
      sections.push(current);
      bodyLines.length = 0;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const m = line.match(SECTION_RE);
    if (m) {
      flush();
      current = {
        sectionType: m[1].replace(/\s+/, ' '),
        name: m[2].trim(),
        tag: m[3]?.replace(/[\[\]\s]/g, '') ?? '',
        body: '',
      };
    } else if (current) {
      bodyLines.push(line);
    } else if (line.trim()) {
      // Text before any section header
      if (sections.length === 0) {
        sections.push({ sectionType: '', name: '', tag: '', body: line });
      } else {
        sections[sections.length - 1].body += '\n' + line;
      }
    }
  }
  flush();
  return sections.filter(s => s.body || s.name);
}

function getSkillIcon(section: SkillSection, heroInfo: HeroIconInfo | undefined): string | null {
  if (!heroInfo?.skills.length) return null;
  const skills = heroInfo.skills;
  const validImg = (img: string | undefined) => (img || null);
  // Try exact name match
  const byName = skills.find(s => s.skillName.toLowerCase() === section.name.toLowerCase());
  if (byName?.skillImg) return validImg(byName.skillImg);
  // Positional fallback
  if (section.sectionType === 'Passive') return validImg(skills[0]?.skillImg);
  const numMatch = section.sectionType.match(/Skill\s*(\d+)/);
  if (numMatch) return validImg(skills[parseInt(numMatch[1])]?.skillImg);
  if (section.sectionType === 'Ultimate') return validImg(skills[skills.length - 1]?.skillImg);
  return null;
}

async function fetchPatches(): Promise<Patch[]> {
  const res = await fetch(`${API_BASE_URL}/api/patches`);
  if (!res.ok) throw new Error('Failed to fetch patches');
  return res.json();
}

async function fetchHeroIcons(): Promise<HeroIconMap> {
  const res = await fetch(`${API_BASE_URL}/api/hero-icons`);
  if (!res.ok) return {};
  return res.json();
}

type FilterType = 'all' | 'buff' | 'nerf' | 'adjust' | 'revamp';

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  buff:   { label: 'Buff',   color: 'text-green-400',  bg: 'bg-green-500/20',  border: 'border-l-green-500',  icon: <TrendingUp className="w-3.5 h-3.5" /> },
  nerf:   { label: 'Nerf',   color: 'text-red-400',    bg: 'bg-red-500/20',    border: 'border-l-red-500',    icon: <TrendingDown className="w-3.5 h-3.5" /> },
  adjust: { label: 'Adjust', color: 'text-blue-400',   bg: 'bg-blue-500/20',   border: 'border-l-blue-500',   icon: <Minus className="w-3.5 h-3.5" /> },
  revamp: { label: 'Revamp', color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-l-purple-500', icon: <Zap className="w-3.5 h-3.5" /> },
};

const TAG_COLOR: Record<string, string> = {
  buff: 'text-green-400', nerf: 'text-red-400', adjust: 'text-blue-400', revamp: 'text-purple-400',
};

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type.toLowerCase()] ?? TYPE_CONFIG.adjust;
}

export function PatchNotesPage() {
  useEffect(() => {
    document.title = 'Patch Notes - Mobile Legends: Bang Bang | MLBB Hub';
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', 'Full MLBB patch notes history. Track every hero buff, nerf, and balance change across all patches.');
    return () => { document.title = 'MLBB Hub'; };
  }, []);

  const { data: patches, isLoading, error } = useQuery({
    queryKey: ['patches'],
    queryFn: fetchPatches,
    staleTime: 1000 * 60 * 5,
  });

  const { data: heroIconMap = {} } = useQuery({
    queryKey: ['heroIcons'],
    queryFn: fetchHeroIcons,
    staleTime: 1000 * 60 * 30,
  });

  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedHero, setSelectedHero] = useState<HeroChange | null>(null);
  const [patchSearch, setPatchSearch] = useState('');

  useEffect(() => {
    if (patches && patches.length > 0 && !selectedVersion) {
      setSelectedVersion(patches[0].version);
    }
  }, [patches, selectedVersion]);

  const filteredPatches = useMemo(() => {
    if (!patches) return [];
    if (!patchSearch.trim()) return patches;
    return patches.filter(p => p.version.includes(patchSearch.trim()));
  }, [patches, patchSearch]);

  const currentPatch = useMemo(() => {
    if (!patches || !selectedVersion) return null;
    return patches.find(p => p.version === selectedVersion) ?? null;
  }, [patches, selectedVersion]);

  const filteredHeroes = useMemo(() => {
    if (!currentPatch) return [];
    return currentPatch.heroes.filter(h => {
      const matchName = h.hero.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = filterType === 'all' || h.type.toLowerCase() === filterType;
      return matchName && matchType;
    });
  }, [currentPatch, searchQuery, filterType]);

  const typeCounts = useMemo(() => {
    if (!currentPatch) return { buff: 0, nerf: 0, adjust: 0, revamp: 0 };
    return currentPatch.heroes.reduce((acc, h) => {
      const t = h.type.toLowerCase() as FilterType;
      if (t in acc) acc[t as keyof typeof acc]++;
      return acc;
    }, { buff: 0, nerf: 0, adjust: 0, revamp: 0 });
  }, [currentPatch]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 pt-20 md:pt-28 pb-12">
        <Loading message="Memuat patch notes..." />
      </div>
    );
  }

  if (error || !patches) {
    return (
      <div className="min-h-screen bg-dark-400 flex items-center justify-center pt-20">
        <p className="text-red-400">Gagal memuat patch notes.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-400">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 pt-20 md:pt-28 pb-24 md:pb-12">
        <div className="mb-6">
          <h1 className="text-3xl md:text-5xl font-display font-bold mb-2">Patch Notes</h1>
          <p className="text-gray-400 text-sm md:text-base">{patches.length} patches — Liquipedia data</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Patch List */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-dark-200 border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-3 border-b border-white/10">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Cari versi..."
                    value={patchSearch}
                    onChange={e => setPatchSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-dark-100 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50"
                  />
                </div>
              </div>
              <div className="overflow-y-auto max-h-[60vh] lg:max-h-[70vh]">
                {filteredPatches.map(patch => (
                  <button
                    key={patch.version}
                    onClick={() => {
                      setSelectedVersion(patch.version);
                      setSearchQuery('');
                      setFilterType('all');
                    }}
                    className={`w-full text-left px-4 py-3 flex items-center justify-between gap-2 border-b border-white/5 transition-colors ${
                      selectedVersion === patch.version
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-sm">{patch.version}</p>
                      {patch.releaseDate && (
                        <p className="text-xs text-gray-500 mt-0.5">{patch.releaseDate}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {patch.heroCount > 0 && (
                        <span className="text-xs text-gray-500">{patch.heroCount}</span>
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Patch Detail */}
          <div className="flex-1 min-w-0">
            {currentPatch ? (
              <>
                <div className="bg-dark-200 border border-white/10 rounded-2xl p-5 mb-4">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white">Patch {currentPatch.version}</h2>
                      {currentPatch.releaseDate && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-400 mt-1">
                          <Calendar className="w-4 h-4" />
                          <span>{currentPatch.releaseDate}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">{currentPatch.heroCount}</p>
                      <p className="text-xs text-gray-400">Hero Changes</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(['all', 'buff', 'nerf', 'adjust', 'revamp'] as FilterType[]).map(type => {
                      const count = type === 'all' ? currentPatch.heroCount : typeCounts[type];
                      if (type !== 'all' && count === 0) return null;
                      const cfg = type === 'all' ? null : getTypeConfig(type);
                      const isActive = filterType === type;
                      return (
                        <button
                          key={type}
                          onClick={() => setFilterType(type)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            isActive
                              ? (cfg ? `${cfg.bg} ${cfg.color}` : 'bg-primary-500 text-white')
                              : 'bg-dark-100 border border-white/10 text-gray-400 hover:text-white'
                          }`}
                        >
                          {cfg && cfg.icon}
                          <span className="capitalize">{type === 'all' ? 'Semua' : cfg?.label}</span>
                          <span className={`px-1.5 py-0.5 rounded text-xs ${isActive ? 'bg-white/20' : 'bg-white/5'}`}>{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Cari hero di patch ini..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-dark-200 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50 transition-colors"
                  />
                </div>

                {filteredHeroes.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    {currentPatch.heroCount === 0
                      ? 'Tidak ada data hero adjustments untuk patch ini.'
                      : 'Tidak ada hero yang cocok.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredHeroes.map((hero, idx) => (
                      <HeroChangeCard
                        key={`${hero.hero}-${idx}`}
                        hero={hero}
                        heroInfo={heroIconMap[hero.hero]}
                        onClick={() => setSelectedHero(hero)}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20 text-gray-500">Pilih patch dari daftar kiri.</div>
            )}
          </div>
        </div>
      </div>

      {selectedHero && (
        <HeroChangeModal
          hero={selectedHero}
          version={selectedVersion ?? ''}
          heroInfo={heroIconMap[selectedHero.hero]}
          onClose={() => setSelectedHero(null)}
        />
      )}
    </div>
  );
}

function HeroChangeCard({
  hero,
  heroInfo,
  onClick,
}: {
  hero: HeroChange;
  heroInfo: HeroIconInfo | undefined;
  onClick: () => void;
}) {
  const cfg = getTypeConfig(hero.type);
  const cleanChanges = cleanWiki(hero.changes);
  const cleanNote = cleanWiki(hero.note);
  const preview = cleanNote || (cleanChanges ? cleanChanges.split('\n')[0].slice(0, 80) + (cleanChanges.length > 80 ? '...' : '') : 'Lihat detail perubahan');

  return (
    <button
      onClick={onClick}
      className={`group w-full text-left bg-dark-200 border border-white/10 border-l-4 ${cfg.border} rounded-xl p-4 hover:bg-dark-100 transition-all`}
    >
      <div className="flex items-center gap-3 mb-2">
        {/* Hero icon */}
        {heroInfo?.icon ? (
          <img
            src={heroInfo.icon}
            alt={hero.hero}
            className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-white/10"
            loading="lazy"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-dark-100 border border-white/10 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-gray-600" />
          </div>
        )}
        <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
          <h3 className="font-bold text-white group-hover:text-primary-400 transition-colors truncate">{hero.hero}</h3>
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
            {cfg.icon}
            {cfg.label}
          </span>
        </div>
      </div>
      {/* Skill icons preview */}
      {heroInfo?.skills && heroInfo.skills.length > 0 && (
        <div className="flex gap-1.5 mb-2 ml-13">
          {heroInfo.skills.filter(s => s.skillImg).slice(0, 5).map((s, i) => (
            <img
              key={i}
              src={resolveUrl(s.skillImg)}
              alt={s.skillName}
              title={s.skillName}
              className="w-7 h-7 rounded-md object-cover border border-white/10 opacity-70"
              loading="lazy"
            />
          ))}
        </div>
      )}
      {preview && (
        <p className="text-sm text-gray-400 line-clamp-2 mt-1">{preview}</p>
      )}
    </button>
  );
}

function HeroChangeModal({
  hero,
  version,
  heroInfo,
  onClose,
}: {
  hero: HeroChange;
  version: string;
  heroInfo: HeroIconInfo | undefined;
  onClose: () => void;
}) {
  const cfg = getTypeConfig(hero.type);
  const sections = useMemo(() => parseSkillSections(hero.changes || ''), [hero.changes]);
  const cleanNote = cleanWiki(hero.note);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full md:w-auto md:max-w-lg md:mx-4 max-h-[85vh] md:max-h-[80vh] bg-dark-300 border border-white/10 rounded-t-2xl md:rounded-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 flex items-center gap-3 p-4 md:p-5 border-b border-white/10 bg-dark-300">
          {heroInfo?.icon ? (
            <img
              src={heroInfo.icon}
              alt={hero.hero}
              className="w-12 h-12 rounded-xl object-cover border border-white/10 flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-dark-200 border border-white/10 flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-gray-600" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white">{hero.hero}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                {cfg.icon}
                {cfg.label}
              </span>
              <span className="text-xs text-gray-500">Patch {version}</span>
            </div>
            {/* Skill icons row — always visible */}
            {heroInfo?.skills && heroInfo.skills.filter(s => s.skillImg).length > 0 && (
              <div className="flex gap-1.5 mt-2">
                {heroInfo.skills.filter(s => s.skillImg).slice(0, 5).map((s, i) => (
                  <img
                    key={i}
                    src={resolveUrl(s.skillImg)}
                    alt={s.skillName}
                    title={s.skillName}
                    className="w-8 h-8 rounded-lg object-cover border border-white/10"
                  />
                ))}
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4 md:p-5 pb-8 space-y-3">
          {cleanNote && (
            <div className="bg-dark-200 rounded-xl p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Note</p>
              <p className="text-sm text-gray-300">{cleanNote}</p>
            </div>
          )}

          {sections.length === 0 && !cleanNote && (
            <p className="text-center text-gray-500 py-6">Tidak ada detail perubahan.</p>
          )}

          {sections.map((section, idx) => {
            const skillIcon = section.sectionType ? getSkillIcon(section, heroInfo) : null;
            const tagColor = TAG_COLOR[section.tag.toLowerCase()] ?? '';

            return (
              <div key={idx} className="bg-dark-200 rounded-xl overflow-hidden">
                {/* Section header — show if it has a named skill/section */}
                {(section.sectionType || section.name) && (
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-dark-100/50">
                    {skillIcon && skillIcon !== '' ? (
                      <img
                        src={resolveUrl(skillIcon)}
                        alt={section.name}
                        className="w-9 h-9 rounded-lg object-cover border border-white/10 flex-shrink-0"
                      />
                    ) : section.sectionType ? (
                      <div className="w-9 h-9 rounded-lg bg-dark-300 border border-white/10 flex items-center justify-center flex-shrink-0">
                        {section.sectionType === 'Attributes' ? (
                          <img src={`${API_BASE_URL}/images/skills/attributes.svg`} alt="Attributes" className="w-7 h-7 object-contain" />
                        ) : section.sectionType === 'Others' ? (
                          <Wrench className="w-5 h-5 text-gray-400" />
                        ) : (
                          <span className="text-xs font-bold text-gray-400">
                            {section.sectionType === 'Passive' ? 'P' :
                             section.sectionType === 'Ultimate' ? 'ULT' :
                             section.sectionType.replace('Skill ', 'S')}
                          </span>
                        )}
                      </div>
                    ) : null}
                    <div className="flex-1 min-w-0">
                      {section.sectionType && (
                        <p className="text-xs text-gray-500 uppercase tracking-wider leading-none mb-0.5">
                          {section.sectionType}
                        </p>
                      )}
                      {section.name && (
                        <p className="text-sm font-semibold text-white leading-tight">{section.name}</p>
                      )}
                    </div>
                    {section.tag && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-white/5 ${tagColor}`}>
                        {section.tag}
                      </span>
                    )}
                  </div>
                )}
                {section.body && (
                  <div className="px-4 py-3 text-sm text-gray-300 whitespace-pre-line leading-relaxed">
                    {section.body}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
