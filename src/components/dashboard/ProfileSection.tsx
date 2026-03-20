import { useState, useRef } from 'react';
import { Save, X, Loader2, Check, Camera, User } from 'lucide-react';
import type { Contributor } from '../../hooks/useUser';
import { useUpdateProfile, useUploadAvatar } from '../../hooks/useUser';

const API_BASE_URL = import.meta.env.DEV ? '' : 'https://mlbbapi.project-n.site';

const BADGES = [
  { id: 'elite',     name: 'Elite',         icon: '👑', emoji: true, minContribs: 50, color: 'text-yellow-300 bg-yellow-500/15 border-yellow-500/30' },
  { id: 'veteran',   name: 'Veteran',        icon: '🏆', emoji: true, minContribs: 30, color: 'text-orange-300 bg-orange-500/15 border-orange-500/30' },
  { id: 'dedicated', name: 'Berdedikasi',    icon: '💎', emoji: true, minContribs: 15, color: 'text-blue-300 bg-blue-500/15 border-blue-500/30' },
  { id: 'active',    name: 'Aktif',          icon: '🔥', emoji: true, minContribs: 5,  color: 'text-red-300 bg-red-500/15 border-red-500/30' },
  { id: 'newbie',    name: 'Pendatang Baru', icon: '🌱', emoji: true, minContribs: 1,  color: 'text-green-300 bg-green-500/15 border-green-500/30' },
];

export function getBadges(totalContributions: number) {
  return BADGES.filter(b => totalContributions >= b.minContribs);
}

interface ProfileSectionProps {
  user: Contributor;
}

export function ProfileSection({ user }: ProfileSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();

  const earnedBadges = getBadges(user.totalContributions);
  const avatarSrc = avatarPreview || (user.avatar ? `${API_BASE_URL}${user.avatar.startsWith('/') ? user.avatar : '/' + user.avatar}` : null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    try {
      await uploadAvatar.mutateAsync(file);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError((err as Error).message);
      setAvatarPreview(null);
    }
  };

  const handleCancel = () => {
    setName(user.name);
    setEmail(user.email);
    setIsEditing(false);
    setError('');
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (!name.trim()) { setError('Nama wajib diisi'); return; }
    if (!email.trim()) { setError('Email wajib diisi'); return; }
    try {
      await updateProfile.mutateAsync({ name: name.trim(), email: email.trim() });
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Informasi Profil</h2>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="btn-secondary">
            Edit Profil
          </button>
        )}
      </div>

      {success && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3">
          <Check className="w-5 h-5 text-green-400" />
          <p className="text-green-400">Profil berhasil diperbarui!</p>
        </div>
      )}

      {/* Avatar */}
      <div className="flex items-center gap-5 mb-6">
        <div className="relative">
          <div className={`w-20 h-20 rounded-full overflow-hidden border-2 ${user.hasDonorFrame ? 'border-yellow-400 shadow-[0_0_16px_#FFB300]' : 'border-white/20'}`}>
            {avatarSrc ? (
              <img src={avatarSrc} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-dark-200 flex items-center justify-center">
                <User className="w-8 h-8 text-gray-500" />
              </div>
            )}
          </div>
          {user.hasDonorFrame && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-dark-400 text-xs">
              💝
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadAvatar.isPending}
            className="absolute -bottom-1 -left-1 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center border-2 border-dark-400 hover:bg-primary-400 transition-colors disabled:opacity-50"
          >
            {uploadAvatar.isPending ? <Loader2 className="w-3 h-3 animate-spin text-white" /> : <Camera className="w-3 h-3 text-white" />}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <div>
          <p className="font-bold text-white text-lg">{user.name}</p>
          <p className="text-sm text-gray-400">{user.email}</p>
          {user.hasDonorFrame && (
            <p className="text-xs text-yellow-400 mt-0.5">✨ Supporter — terima kasih atas dukungannya!</p>
          )}
        </div>
      </div>

      {/* Badges */}
      {earnedBadges.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-semibold text-gray-400 mb-2">Badge</p>
          <div className="flex flex-wrap gap-2">
            {earnedBadges.map(badge => (
              <span key={badge.id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${badge.color}`}>
                <span>{badge.icon}</span>
                {badge.name}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-2">
            {user.totalContributions} kontribusi disetujui
            {user.totalContributions < 50 && (() => {
              const next = BADGES.slice().reverse().find(b => b.minContribs > user.totalContributions);
              return next ? ` · ${next.minContribs - user.totalContributions} lagi untuk badge ${next.name}` : '';
            })()}
          </p>
        </div>
      )}
      {earnedBadges.length === 0 && (
        <div className="mb-6 p-3 bg-dark-200 border border-white/5 rounded-xl text-xs text-gray-500">
          🌱 Dapatkan kontribusi pertamamu untuk unlock badge!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Nama Tampilan</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!isEditing || updateProfile.isPending}
            className="w-full px-4 py-3 bg-dark-50 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Alamat Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!isEditing || updateProfile.isPending}
            className="w-full px-4 py-3 bg-dark-50 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Bergabung Sejak</label>
          <input
            type="text"
            value={new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            disabled
            className="w-full px-4 py-3 bg-dark-50 border border-white/10 rounded-lg text-gray-400 cursor-not-allowed"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {isEditing && (
          <div className="flex gap-3">
            <button type="submit" disabled={updateProfile.isPending} className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {updateProfile.isPending ? <><Loader2 className="w-5 h-5 animate-spin" />Menyimpan...</> : <><Save className="w-5 h-5" />Simpan Perubahan</>}
            </button>
            <button type="button" onClick={handleCancel} disabled={updateProfile.isPending} className="flex-1 btn-secondary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              <X className="w-5 h-5" />Batal
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
