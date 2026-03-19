import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, Info, Plus, X, Search, Shield, Sword, Zap, Wand2, Target, HeartPulse, Swords, Users, TrendingUp, Sprout, Map, Send, LogIn } from 'lucide-react';
import { useHeroes } from '../hooks/useHeroes';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../hooks/useUser';
import { useNavigate, Link } from '@tanstack/react-router';

type ContributionType = 'skin' | 'hero' | 'series' | 'skin-edit';

interface SkinFormData {
  heroId: number;
  heroName: string;
  skinName: string;
  skinSeries: string;
  skinTier?: string;
  skinCover?: string;
}

interface HeroFormData {
  name: string;
  role: string;
  lane: string;
  icon?: string;
  banner?: string;
}

interface SeriesSkin {
  heroId: number;
  heroName: string;
  skinName: string;
}

interface SeriesFormData {
  seriesName: string;
  description?: string;
  skins: SeriesSkin[];
}

interface SkinEditFormData {
  heroId: number;
  heroName: string;
  skinName: string;
  currentTier: string;
  currentSeries: string;
  newTier: string;
  newSeries: string;
  reason: string;
}

const ROLES = [
  { value: 'Tank', label: 'Tank', icon: Shield, color: 'text-blue-400' },
  { value: 'Fighter', label: 'Fighter', icon: Sword, color: 'text-red-400' },
  { value: 'Assassin', label: 'Assassin', icon: Zap, color: 'text-purple-400' },
  { value: 'Mage', label: 'Mage', icon: Wand2, color: 'text-cyan-400' },
  { value: 'Marksman', label: 'Marksman', icon: Target, color: 'text-orange-400' },
  { value: 'Support', label: 'Support', icon: HeartPulse, color: 'text-green-400' },
];

const LANES = [
  { value: 'EXP Lane', label: 'EXP Lane', icon: Swords, color: 'text-red-400' },
  { value: 'Jungle', label: 'Jungle', icon: Sprout, color: 'text-green-400' },
  { value: 'Mid Lane', label: 'Mid Lane', icon: TrendingUp, color: 'text-purple-400' },
  { value: 'Gold Lane', label: 'Gold Lane', icon: Target, color: 'text-yellow-400' },
  { value: 'Roam', label: 'Roam', icon: Map, color: 'text-blue-400' },
];

// Skin tier definitions (MLBB)
const TIERS = [
  { value: 'Collector', label: 'Collector', color: '#FF6B35' },
  { value: 'Lightborn', label: 'Lightborn', color: '#60A5FA' },
  { value: 'Legend', label: 'Legend', color: '#FFD700' },
  { value: 'Starlight', label: 'Starlight', color: '#C084FC' },
  { value: 'Epic', label: 'Epic', color: '#A78BFA' },
  { value: 'Special', label: 'Special', color: '#34D399' },
  { value: 'Elite', label: 'Elite', color: '#F59E0B' },
  { value: 'Limited', label: 'Limited', color: '#F43F5E' },
  { value: 'FMVP', label: 'FMVP', color: '#EF4444' },
  { value: 'Collab', label: 'Collab', color: '#F59E42' },
  { value: 'Default', label: 'Default', color: '#9CA3AF' },
];

// Collaboration series (MLBB)
const COLLAB_SERIES = [
  'Naruto Shippuden',
  'Jujutsu Kaisen',
  'Attack on Titan',
  'Star Wars',
  'Transformers',
  'Venom',
  'Saint Seiya',
  'Sanrio Characters',
  'Kung Fu Panda',
  'King of Fighters',
  'Dragon Ball',
  'One Piece',
];

// Series to tier auto-mapping (MLBB)
const SERIES_TIER_MAP: Record<string, string> = {
  // Collab series
  'Naruto Shippuden': 'Collab',
  'Jujutsu Kaisen': 'Collab',
  'Attack on Titan': 'Collab',
  'Star Wars': 'Collab',
  'Transformers': 'Collab',
  'Venom': 'Collab',
  'Saint Seiya': 'Collab',
  'Sanrio Characters': 'Collab',
  'Kung Fu Panda': 'Collab',
  'King of Fighters': 'Collab',
  'Dragon Ball': 'Collab',
  'One Piece': 'Collab',
  // Legend tier series
  'Lightborn': 'Lightborn',
  // Epic tier series
  'Exorcist': 'Epic',
  'Zodiac': 'Epic',
  'ABYSS': 'Epic',
  'PRIME': 'Epic',
  'Soul Vessel': 'Epic',
  'Kishin': 'Epic',
  'Mistbenders': 'Epic',
  'Neobeasts': 'Epic',
  'M-World': 'Epic',
  // Starlight
  'Starlight': 'Starlight',
  // Special
  'The Aspirants': 'Special',
  // Rare tier
  'CAMPUS DIARIES': 'Rare',
};

// Auto-detect tier from series
function getAutoTier(series: string): string {
  if (!series) return '';
  const upperSeries = series.toUpperCase().trim();

  // Check exact match first
  if (SERIES_TIER_MAP[series]) return SERIES_TIER_MAP[series];
  if (SERIES_TIER_MAP[upperSeries]) return SERIES_TIER_MAP[upperSeries];

  // Check partial match for collaborations
  for (const collab of COLLAB_SERIES) {
    if (upperSeries.includes(collab) || collab.includes(upperSeries)) {
      return 'Epic';
    }
  }

  // Default to Epic for named series, empty for no series
  return series ? 'Epic' : '';
}

export function ContributePage() {
  const { data: heroes, isLoading } = useHeroes();
  const { token, contributorId } = useAuth();
  const { data: user } = useUser();
  const navigate = useNavigate();
  const [contributionType, setContributionType] = useState<ContributionType>('skin');
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [heroSearch, setHeroSearch] = useState('');
  const [showHeroPicker, setShowHeroPicker] = useState(false);
  const [activeSeriesSkinPicker, setActiveSeriesSkinPicker] = useState<number | null>(null);

  const [skinForm, setSkinForm] = useState<SkinFormData>({
    heroId: 0,
    heroName: '',
    skinName: '',
    skinSeries: '',
    skinTier: '',
    skinCover: ''
  });

  const [heroForm, setHeroForm] = useState<HeroFormData>({
    name: '',
    role: '',
    lane: '',
    icon: '',
    banner: ''
  });

  const [seriesForm, setSeriesForm] = useState<SeriesFormData>({
    seriesName: '',
    description: '',
    skins: []
  });

  const [skinEditForm, setSkinEditForm] = useState<SkinEditFormData>({
    heroId: 0,
    heroName: '',
    skinName: '',
    currentTier: '',
    currentSeries: '',
    newTier: '',
    newSeries: '',
    reason: ''
  });

  const handleHeroSelect = (heroId: number) => {
    const selectedHero = heroes?.find(h => h.heroId === heroId);
    if (selectedHero) {
      setSkinForm({
        ...skinForm,
        heroId,
        heroName: selectedHero.name
      });
      setShowHeroPicker(false);
      setHeroSearch('');
    }
  };

  const handleSeriesHeroSelect = (index: number, heroId: number) => {
    const selectedHero = heroes?.find(h => h.heroId === heroId);
    if (selectedHero) {
      const updatedSkins = [...seriesForm.skins];
      updatedSkins[index] = {
        heroId,
        heroName: selectedHero.name,
        skinName: updatedSkins[index]?.skinName || ''
      };
      setSeriesForm({ ...seriesForm, skins: updatedSkins });
      setActiveSeriesSkinPicker(null);
      setHeroSearch('');
    }
  };

  const handleAddSeriesSkin = () => {
    setSeriesForm({
      ...seriesForm,
      skins: [...seriesForm.skins, { heroId: 0, heroName: '', skinName: '' }]
    });
  };

  const handleRemoveSeriesSkin = (index: number) => {
    setSeriesForm({
      ...seriesForm,
      skins: seriesForm.skins.filter((_, i) => i !== index)
    });
  };

  const handleUpdateSeriesSkinName = (index: number, skinName: string) => {
    const updatedSkins = [...seriesForm.skins];
    updatedSkins[index] = { ...updatedSkins[index], skinName };
    setSeriesForm({ ...seriesForm, skins: updatedSkins });
  };

  const validateForm = (): boolean => {
    if (contributionType === 'skin') {
      if (!skinForm.heroId || !skinForm.skinName.trim()) {
        setErrorMessage('Pilih hero dan masukkan nama skin');
        return false;
      }
    } else if (contributionType === 'hero') {
      if (!heroForm.name.trim() || !heroForm.role.trim() || !heroForm.lane.trim()) {
        setErrorMessage('Isi nama hero, role, dan lane');
        return false;
      }
    } else if (contributionType === 'series') {
      if (!seriesForm.seriesName.trim()) {
        setErrorMessage('Masukkan nama series');
        return false;
      }
      if (seriesForm.skins.length === 0) {
        setErrorMessage('Tambahkan minimal satu skin ke series');
        return false;
      }
      if (seriesForm.skins.some(s => !s.heroId || !s.skinName.trim())) {
        setErrorMessage('Semua skin harus memiliki hero dan nama skin');
        return false;
      }
    } else if (contributionType === 'skin-edit') {
      if (!skinEditForm.heroId || !skinEditForm.skinName) {
        setErrorMessage('Pilih hero dan skin');
        return false;
      }
      if (!skinEditForm.newTier && !skinEditForm.newSeries) {
        setErrorMessage('Berikan setidaknya satu koreksi (tier atau series)');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    setErrorMessage('');

    // Check if user is logged in
    if (!contributorId || !token) {
      navigate({ to: '/auth' });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setSubmitStatus('submitting');

    const API_BASE_URL = import.meta.env.DEV ? '' : 'https://mlbbapi.project-n.site';

    let contributionData: any;

    if (contributionType === 'skin') {
      contributionData = {
        type: 'skin',
        contributorId,
        contributorName: user?.name || '',
        data: {
          heroId: skinForm.heroId,
          heroName: skinForm.heroName,
          skin: {
            skinName: skinForm.skinName,
            skinSeries: skinForm.skinSeries,
            ...(skinForm.skinTier && { skinTier: skinForm.skinTier }),
            ...(skinForm.skinCover && {
              skinCover: skinForm.skinCover,
              skinImage: skinForm.skinCover
            })
          }
        }
      };
    } else if (contributionType === 'hero') {
      contributionData = {
        type: 'hero',
        contributorId,
        contributorName: user?.name || '',
        data: {
          heroId: Math.floor(Math.random() * 1000) + 500,
          name: heroForm.name.toUpperCase(),
          role: heroForm.role,
          lane: heroForm.lane,
          ...(heroForm.icon && { icon: heroForm.icon }),
          ...(heroForm.banner && { banner: heroForm.banner }),
          skins: []
        }
      };
    } else if (contributionType === 'series') {
      contributionData = {
        type: 'series',
        contributorId,
        contributorName: user?.name || '',
        data: {
          seriesName: seriesForm.seriesName,
          ...(seriesForm.description && { description: seriesForm.description }),
          skins: seriesForm.skins.map(s => ({
            heroId: s.heroId,
            skinName: s.skinName
          }))
        }
      };
    } else if (contributionType === 'skin-edit') {
      contributionData = {
        type: 'skin-edit',
        contributorId,
        contributorName: user?.name || '',
        data: {
          heroId: skinEditForm.heroId,
          heroName: skinEditForm.heroName,
          skinName: skinEditForm.skinName,
          currentTier: skinEditForm.currentTier,
          currentSeries: skinEditForm.currentSeries,
          newTier: skinEditForm.newTier,
          newSeries: skinEditForm.newSeries,
          reason: skinEditForm.reason
        }
      };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/contribute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(contributionData)
      });

      if (response.ok) {
        setSubmitStatus('success');
        setSkinForm({ heroId: 0, heroName: '', skinName: '', skinSeries: '', skinTier: '', skinCover: '' });
        setHeroForm({ name: '', role: '', lane: '', icon: '', banner: '' });
        setSeriesForm({ seriesName: '', description: '', skins: [] });
        setSkinEditForm({ heroId: 0, heroName: '', skinName: '', currentTier: '', currentSeries: '', newTier: '', newSeries: '', reason: '' });
        setTimeout(() => setSubmitStatus('idle'), 5000);
      } else {
        const error = await response.json();
        setErrorMessage(error.error || 'Gagal mengirim');
        setSubmitStatus('error');
      }
    } catch (error) {
      setErrorMessage('Kesalahan jaringan - coba lagi');
      setSubmitStatus('error');
    }
  };

  const filteredHeroes = heroes?.filter(h =>
    h.name.toLowerCase().includes(heroSearch.toLowerCase())
  );

  // Hero Picker Component
  const HeroPicker = ({
    onSelect,
    show,
    onToggle
  }: {
    onSelect: (heroId: number) => void;
    show: boolean;
    onToggle: () => void;
  }) => (
    <div>
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 bg-dark-50 border border-white/10 rounded-lg hover:border-primary-500 transition-colors text-left text-gray-400"
        disabled={isLoading}
      >
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-primary-400" />
          <span>{isLoading ? 'Memuat heroes...' : 'Klik untuk memilih hero'}</span>
        </div>
      </button>

      {show && !isLoading && (
        <div className="mt-3 p-4 md:p-5 bg-dark-200 border border-white/10 rounded-xl">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={heroSearch}
              onChange={(e) => setHeroSearch(e.target.value)}
              placeholder="Cari heroes..."
              className="w-full pl-12 pr-4 py-3 bg-dark-50 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 text-white"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 max-h-80 overflow-y-auto">
            {filteredHeroes?.map(hero => (
              <button
                key={hero.heroId}
                onClick={() => onSelect(hero.heroId)}
                className="group relative aspect-square rounded-full overflow-hidden border-2 border-white/10 hover:border-primary-500 transition-all hover:scale-110"
                title={hero.name}
              >
                <img
                  src={hero.icon}
                  alt={hero.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-1">
                  <span className="text-[9px] font-bold text-white text-center px-0.5 leading-tight">
                    {hero.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-400">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 pt-20 md:pt-28 pb-12">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-5xl font-display font-bold mb-2 md:mb-4">
          Kontribusi Data
        </h1>
        <p className="text-gray-400 text-sm md:text-lg">
          Bantu kami melengkapi database Mobile Legends: Bang Bang!
        </p>
      </div>

      {/* Login Notice */}
      {!contributorId && (
        <div className="mb-8 bg-primary-500/10 border border-primary-500/20 rounded-lg p-5 md:p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary-500/20 rounded-lg">
              <LogIn className="w-6 h-6 text-primary-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-2">Login Diperlukan</h3>
              <p className="text-gray-300 mb-4">
                Kamu harus login untuk mengirim kontribusi. Ini membantu kami melacak kontribusimu dan memberikan kredit di leaderboard!
              </p>
              <Link
                to="/auth"
                className="btn-primary inline-flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Masuk / Daftar
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Logged In User Info */}
      {contributorId && (
        <div className="mb-8 bg-green-500/10 border border-green-500/20 rounded-lg p-5 md:p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-1">Selamat datang kembali, {user?.name}!</h3>
              <p className="text-gray-300">
                Kontribusimu akan dikreditkan ke akunmu dan dilacak di leaderboard.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="mb-8 bg-blue-500/10 border border-blue-500/20 rounded-lg p-5 md:p-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-gray-300">
            <p className="font-semibold text-white mb-2">Cara kerja:</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-300">
              <li>Pilih jenis kontribusi dan isi formulirnya</li>
              <li>Kirim untuk ditinjau - tim kami akan memverifikasi datanya</li>
              <li>Kontribusi yang disetujui akan digabungkan ke database</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="max-w-6xl mx-auto">
        <div className="card-hover p-4 md:p-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <div className="p-2 bg-primary-500/20 rounded-lg">
              <Upload className="w-6 h-6 text-primary-400" />
            </div>
            Kirim Kontribusi
          </h2>

          {/* Contribution Type Selector */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wide">
              Jenis Kontribusi
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { type: 'skin' as ContributionType, label: 'Tambah Skin', desc: 'Tambah skin yang hilang' },
                { type: 'hero' as ContributionType, label: 'Tambah Hero', desc: 'Tambah hero baru' },
                { type: 'series' as ContributionType, label: 'Tambah Series', desc: 'Tambah skin series' },
                { type: 'skin-edit' as ContributionType, label: 'Perbaiki Tag Skin', desc: 'Perbaiki tier/series yang salah' },
              ].map(item => (
                <button
                  key={item.type}
                  onClick={() => setContributionType(item.type)}
                  className={`p-5 md:p-6 rounded-xl border-2 transition-all ${
                    contributionType === item.type
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="font-bold text-base md:text-lg">{item.label}</div>
                  <div className="text-xs text-gray-400 mt-1">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Skin Form */}
          {contributionType === 'skin' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
                  Pilih Hero <span className="text-red-400">*</span>
                </label>

                {skinForm.heroId === 0 ? (
                  <HeroPicker
                    onSelect={handleHeroSelect}
                    show={showHeroPicker}
                    onToggle={() => setShowHeroPicker(!showHeroPicker)}
                  />
                ) : (
                  <div className="flex items-center gap-4 p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg">
                    <img
                      src={heroes?.find(h => h.heroId === skinForm.heroId)?.icon}
                      alt={skinForm.heroName}
                      className="w-16 h-16 rounded-full border-2 border-primary-500"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-lg">{skinForm.heroName}</div>
                      <div className="text-sm text-gray-400">
                        {heroes?.find(h => h.heroId === skinForm.heroId)?.role} • {heroes?.find(h => h.heroId === skinForm.heroId)?.lane}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSkinForm({ ...skinForm, heroId: 0, heroName: '' });
                        setShowHeroPicker(true);
                      }}
                      className="px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      Ganti
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
                  Nama Skin <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={skinForm.skinName}
                  onChange={(e) => setSkinForm({ ...skinForm, skinName: e.target.value })}
                  placeholder="e.g. Kakashi Hatake"
                  className="w-full px-4 py-3 bg-dark-50 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
                  Skin Series
                  <span className="text-xs text-gray-500 font-normal ml-2">(Ketik untuk melihat saran)</span>
                </label>
                <input
                  type="text"
                  list="series-suggestions"
                  value={skinForm.skinSeries}
                  onChange={(e) => {
                    const newSeries = e.target.value;
                    const autoTier = getAutoTier(newSeries);
                    setSkinForm({
                      ...skinForm,
                      skinSeries: newSeries,
                      skinTier: autoTier || skinForm.skinTier // Keep existing if no auto-tier
                    });
                  }}
                  placeholder="e.g. Naruto Shippuden, Hellfire, Future Era"
                  className="w-full px-4 py-3 bg-dark-50 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 text-white"
                />
                <datalist id="series-suggestions">
                  {/* Collab */}
                  <option value="Naruto Shippuden" />
                  <option value="Jujutsu Kaisen" />
                  <option value="Attack on Titan" />
                  <option value="Star Wars" />
                  <option value="Street Fighter" />
                  <option value="Transformers" />
                  <option value="League of Legends" />
                  <option value="Fate/stay night" />
                  {/* Collector / Lightborn */}
                  <option value="Lightborn" />
                  {/* Legend */}
                  <option value="Hellfire" />
                  <option value="Limbo" />
                  <option value="Five Tiger Generals" />
                  <option value="Dunhuang Encounter" />
                  <option value="EWC" />
                  {/* Starlight */}
                  <option value="Starlight" />
                  {/* Epic */}
                  <option value="Future Era" />
                  <option value="Doomsday Mecha" />
                  <option value="Cosmic Song" />
                  <option value="Space Odyssey" />
                  <option value="Interstellar" />
                  <option value="Journey to the West" />
                  <option value="Gamer" />
                  <option value="Manga Crossover" />
                  <option value="Dragon Hunter" />
                  <option value="Beach Vacation" />
                  {/* Special / Elite */}
                  <option value="Campus Diaries" />
                  <option value="Sweet Escape" />
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
                  Skin Tier {skinForm.skinSeries && getAutoTier(skinForm.skinSeries) && (
                    <span className="text-xs text-primary-400 font-normal ml-2">(Otomatis terdeteksi dari series)</span>
                  )}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {TIERS.map(tier => (
                    <button
                      key={tier.value}
                      onClick={() => setSkinForm({ ...skinForm, skinTier: skinForm.skinTier === tier.value ? '' : tier.value })}
                      className={`px-3 py-2 rounded-lg border-2 transition-all text-xs font-bold uppercase tracking-wide ${
                        skinForm.skinTier === tier.value
                          ? 'border-current text-white'
                          : 'border-white/10 hover:border-white/20 text-gray-400'
                      }`}
                      style={skinForm.skinTier === tier.value ? {
                        borderColor: tier.color,
                        backgroundColor: `${tier.color}33`,
                        color: tier.color
                      } : {}}
                    >
                      {tier.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
                  URL Gambar Skin (Opsional)
                </label>
                <input
                  type="url"
                  value={skinForm.skinCover}
                  onChange={(e) => setSkinForm({ ...skinForm, skinCover: e.target.value })}
                  placeholder="https://mlbb.fandom.com/wiki/..."
                  className="w-full px-4 py-3 bg-dark-50 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 text-white"
                />
              </div>
            </div>
          )}

          {/* Hero Form */}
          {contributionType === 'hero' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
                  Nama Hero <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={heroForm.name}
                  onChange={(e) => setHeroForm({ ...heroForm, name: e.target.value })}
                  placeholder="e.g. LAYLA"
                  className="w-full px-4 py-3 bg-dark-50 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
                  Role <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {ROLES.map(role => {
                    const Icon = role.icon;
                    return (
                      <button
                        key={role.value}
                        onClick={() => setHeroForm({ ...heroForm, role: role.value })}
                        className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                          heroForm.role === role.value
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <Icon className={`w-6 h-6 ${role.color}`} />
                        <span className="font-semibold">{role.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
                  Lane <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {LANES.map(lane => {
                    const Icon = lane.icon;
                    return (
                      <button
                        key={lane.value}
                        onClick={() => setHeroForm({ ...heroForm, lane: lane.value })}
                        className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                          heroForm.lane === lane.value
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <Icon className={`w-6 h-6 ${lane.color}`} />
                        <span className="font-semibold">{lane.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
                  URL Icon Hero (Opsional)
                </label>
                <input
                  type="url"
                  value={heroForm.icon}
                  onChange={(e) => setHeroForm({ ...heroForm, icon: e.target.value })}
                  placeholder="https://example.com/hero-icon.jpg"
                  className="w-full px-4 py-3 bg-dark-50 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
                  URL Banner Hero (Opsional)
                </label>
                <input
                  type="url"
                  value={heroForm.banner}
                  onChange={(e) => setHeroForm({ ...heroForm, banner: e.target.value })}
                  placeholder="https://example.com/hero-banner.jpg"
                  className="w-full px-4 py-3 bg-dark-50 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 text-white"
                />
              </div>
            </div>
          )}

          {/* Series Form */}
          {contributionType === 'series' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
                  Nama Series <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={seriesForm.seriesName}
                  onChange={(e) => setSeriesForm({ ...seriesForm, seriesName: e.target.value })}
                  placeholder="e.g. Naruto Shippuden"
                  className="w-full px-4 py-3 bg-dark-50 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
                  Deskripsi (Opsional)
                </label>
                <textarea
                  value={seriesForm.description}
                  onChange={(e) => setSeriesForm({ ...seriesForm, description: e.target.value })}
                  placeholder="Deskripsi singkat skin series..."
                  rows={3}
                  className="w-full px-4 py-3 bg-dark-50 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 text-white resize-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                    Skin dalam Series <span className="text-red-400">*</span>
                  </label>
                  <button
                    onClick={handleAddSeriesSkin}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 rounded-lg transition-colors text-sm font-semibold"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah Skin
                  </button>
                </div>

                {seriesForm.skins.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-lg">
                    <p className="text-gray-500 mb-3">Belum ada skin yang ditambahkan</p>
                    <button
                      onClick={handleAddSeriesSkin}
                      className="btn-primary"
                    >
                      Tambah Skin Pertama
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {seriesForm.skins.map((skin, index) => (
                      <div key={index} className="p-4 bg-dark-200 border border-white/10 rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-sm font-semibold text-gray-400">Skin #{index + 1}</span>
                          <button
                            onClick={() => handleRemoveSeriesSkin(index)}
                            className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {skin.heroId === 0 ? (
                          <div className="mb-3">
                            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase">Hero</label>
                            <HeroPicker
                              onSelect={(heroId) => handleSeriesHeroSelect(index, heroId)}
                              show={activeSeriesSkinPicker === index}
                              onToggle={() => setActiveSeriesSkinPicker(activeSeriesSkinPicker === index ? null : index)}
                            />
                          </div>
                        ) : (
                          <div className="mb-3 flex items-center gap-3 p-3 bg-dark-100 rounded-lg">
                            <img
                              src={heroes?.find(h => h.heroId === skin.heroId)?.icon}
                              alt={skin.heroName}
                              className="w-10 h-10 rounded-full border-2 border-primary-500"
                            />
                            <div className="flex-1">
                              <div className="font-semibold text-sm">{skin.heroName}</div>
                              <div className="text-xs text-gray-400">
                                {heroes?.find(h => h.heroId === skin.heroId)?.role}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                const updatedSkins = [...seriesForm.skins];
                                updatedSkins[index] = { heroId: 0, heroName: '', skinName: skin.skinName };
                                setSeriesForm({ ...seriesForm, skins: updatedSkins });
                                setActiveSeriesSkinPicker(index);
                              }}
                              className="text-xs text-red-400 hover:text-red-300"
                            >
                              Ganti
                            </button>
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase">Nama Skin</label>
                          <input
                            type="text"
                            list={`skin-list-${index}`}
                            value={skin.skinName}
                            onChange={(e) => handleUpdateSeriesSkinName(index, e.target.value)}
                            placeholder="Pilih atau ketik nama skin..."
                            className="w-full px-3 py-2 bg-dark-100 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 text-white text-sm"
                          />
                          {skin.heroId !== 0 && (
                            <datalist id={`skin-list-${index}`}>
                              {(heroes?.find(h => h.heroId === skin.heroId)?.skins ?? []).map(s => (
                                <option key={s.skinName} value={s.skinName} />
                              ))}
                            </datalist>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Skin Edit Form */}
          {contributionType === 'skin-edit' && (
            <div className="space-y-6">
              {/* Step 1: Select Hero */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
                  Pilih Hero <span className="text-red-400">*</span>
                </label>
                {skinEditForm.heroId === 0 ? (
                  <HeroPicker
                    onSelect={(heroId) => {
                      const h = heroes?.find(h => h.heroId === heroId);
                      if (h) setSkinEditForm({ ...skinEditForm, heroId, heroName: h.name, skinName: '', currentTier: '', currentSeries: '' });
                    }}
                    show={showHeroPicker}
                    onToggle={() => setShowHeroPicker(!showHeroPicker)}
                  />
                ) : (
                  <div className="flex items-center gap-4 p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg">
                    <img
                      src={heroes?.find(h => h.heroId === skinEditForm.heroId)?.icon}
                      alt={skinEditForm.heroName}
                      className="w-14 h-14 rounded-full border-2 border-primary-500"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-lg">{skinEditForm.heroName}</div>
                      <div className="text-sm text-gray-400">{heroes?.find(h => h.heroId === skinEditForm.heroId)?.role}</div>
                    </div>
                    <button
                      onClick={() => {
                        setSkinEditForm({ ...skinEditForm, heroId: 0, heroName: '', skinName: '', currentTier: '', currentSeries: '' });
                        setShowHeroPicker(true);
                      }}
                      className="px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      Ganti
                    </button>
                  </div>
                )}
              </div>

              {/* Step 2: Select Skin */}
              {skinEditForm.heroId !== 0 && (() => {
                const heroSkins = heroes?.find(h => h.heroId === skinEditForm.heroId)?.skins || [];
                return (
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
                      Pilih Skin yang Ingin Diperbaiki <span className="text-red-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                      {heroSkins.map((skin, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSkinEditForm({
                            ...skinEditForm,
                            skinName: skin.skinName,
                            currentTier: skin.tierName || '',
                            currentSeries: skin.skinSeries || '',
                            newTier: skin.tierName || '',
                            newSeries: skin.skinSeries || ''
                          })}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                            skinEditForm.skinName === skin.skinName
                              ? 'border-primary-500 bg-primary-500/10'
                              : 'border-white/10 hover:border-white/20 bg-dark-200/50'
                          }`}
                        >
                          <img
                            src={skin.skinCover || skin.skinImage}
                            alt={skin.skinName}
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                            onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/40?text=?'; }}
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-white truncate">{skin.skinName}</p>
                            <p className="text-[10px] text-gray-500 truncate">{skin.tierName || 'No Tag'}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Step 3: Edit Tags */}
              {skinEditForm.skinName && (
                <>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm text-amber-300">
                    Mengedit tag untuk: <span className="font-bold text-white">{skinEditForm.skinName}</span>
                  </div>

                  {/* Current vs New Tier */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-1 uppercase tracking-wide">
                      Tier
                      {skinEditForm.currentTier && (
                        <span className="text-xs text-gray-500 font-normal ml-2">Saat ini: {skinEditForm.currentTier}</span>
                      )}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                      {TIERS.map(tier => (
                        <button
                          key={tier.value}
                          onClick={() => setSkinEditForm({ ...skinEditForm, newTier: skinEditForm.newTier === tier.value ? '' : tier.value })}
                          className={`px-3 py-2 rounded-lg border-2 transition-all text-xs font-bold uppercase tracking-wide ${
                            skinEditForm.newTier === tier.value
                              ? 'border-current text-white'
                              : 'border-white/10 hover:border-white/20 text-gray-400'
                          }`}
                          style={skinEditForm.newTier === tier.value ? {
                            borderColor: tier.color,
                            backgroundColor: `${tier.color}33`,
                            color: tier.color
                          } : {}}
                        >
                          {tier.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* New Series */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-1 uppercase tracking-wide">
                      Series
                      {skinEditForm.currentSeries && (
                        <span className="text-xs text-gray-500 font-normal ml-2">Saat ini: {skinEditForm.currentSeries}</span>
                      )}
                    </label>
                    <input
                      type="text"
                      list="series-suggestions"
                      value={skinEditForm.newSeries}
                      onChange={(e) => setSkinEditForm({ ...skinEditForm, newSeries: e.target.value })}
                      placeholder="e.g. Naruto Shippuden, Hellfire..."
                      className="w-full px-4 py-3 bg-dark-50 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 text-white"
                    />
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-1 uppercase tracking-wide">
                      Alasan / Sumber
                    </label>
                    <input
                      type="text"
                      value={skinEditForm.reason}
                      onChange={(e) => setSkinEditForm({ ...skinEditForm, reason: e.target.value })}
                      placeholder="Contoh: Website resmi ML menampilkan ini sebagai tier Epic"
                      className="w-full px-4 py-3 bg-dark-50 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 text-white"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mt-5 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-400">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {submitStatus === 'success' && (
            <div className="mt-5 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <p className="text-green-400">
                  Kontribusi berhasil dikirim! Tim kami akan segera meninjaunya.
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="mt-6">
            <button
              onClick={handleSubmit}
              disabled={submitStatus === 'submitting'}
              className="w-full btn-primary flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitStatus === 'submitting' ? (
                <>
                  <Upload className="w-5 h-5 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Kirim Kontribusi
                </>
              )}
            </button>
          </div>
        </div>

        {/* Guidelines */}
        <div className="mt-6 card-hover p-5 md:p-8">
          <h2 className="text-xl font-bold mb-5">Panduan Kontribusi</h2>
          <div className="space-y-4 text-sm text-gray-300">
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Gunakan sumber resmi:</strong> Hanya kirim data dari sumber resmi Mobile Legends: Bang Bang
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Informasi akurat:</strong> Periksa kembali semua data sebelum mengirim
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Gambar berkualitas tinggi:</strong> Gunakan gambar resmi dari mlbb.fandom.com atau website resmi Mobile Legends
              </div>
            </div>
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Tanpa konten fan-made:</strong> Jangan kirim konten buatan penggemar
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
