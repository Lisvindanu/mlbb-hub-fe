import { useState } from 'react';
import { Save, X, Loader2, Check } from 'lucide-react';
import type { Contributor } from '../../hooks/useUser';
import { useUpdateProfile } from '../../hooks/useUser';

interface ProfileSectionProps {
  user: Contributor;
}

export function ProfileSection({ user }: ProfileSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const updateProfile = useUpdateProfile();

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

    if (!name.trim()) {
      setError('Nama wajib diisi');
      return;
    }

    if (!email.trim()) {
      setError('Email wajib diisi');
      return;
    }

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
          <button
            onClick={() => setIsEditing(true)}
            className="btn-secondary"
          >
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Nama Tampilan
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!isEditing || updateProfile.isPending}
            className="w-full px-4 py-3 bg-dark-50 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Alamat Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!isEditing || updateProfile.isPending}
            className="w-full px-4 py-3 bg-dark-50 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Bergabung Sejak
          </label>
          <input
            type="text"
            value={new Date(user.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
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
            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateProfile.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Simpan Perubahan
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={updateProfile.isPending}
              className="flex-1 btn-secondary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-5 h-5" />
              Batal
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
