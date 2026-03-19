import { useState } from 'react';
import { Lock, Loader2, Check, Eye, EyeOff } from 'lucide-react';
import { useChangePassword } from '../../hooks/useUser';

export function PasswordSection() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const changePassword = useChangePassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!currentPassword) {
      setError('Password saat ini wajib diisi');
      return;
    }

    if (!newPassword) {
      setError('Password baru wajib diisi');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password baru minimal 6 karakter');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Password tidak cocok');
      return;
    }

    if (currentPassword === newPassword) {
      setError('Password baru harus berbeda dari password saat ini');
      return;
    }

    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary-500/20 rounded-lg">
          <Lock className="w-6 h-6 text-primary-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Ganti Password</h2>
          <p className="text-gray-400 text-sm">Perbarui password untuk menjaga keamanan akunmu</p>
        </div>
      </div>

      {success && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3">
          <Check className="w-5 h-5 text-green-400" />
          <p className="text-green-400">Password berhasil diubah!</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Password Saat Ini
          </label>
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={changePassword.isPending}
              className="w-full px-4 py-3 bg-dark-50 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 text-white disabled:opacity-50"
              placeholder="Masukkan password saat ini"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Password Baru
          </label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={changePassword.isPending}
              className="w-full px-4 py-3 bg-dark-50 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 text-white disabled:opacity-50"
              placeholder="Masukkan password baru (min 6 karakter)"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className="mt-1.5 text-xs text-gray-500">Minimal 6 karakter</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Konfirmasi Password Baru
          </label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={changePassword.isPending}
              className="w-full px-4 py-3 bg-dark-50 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 text-white disabled:opacity-50"
              placeholder="Konfirmasi password baru kamu"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={changePassword.isPending}
          className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {changePassword.isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Mengganti Password...
            </>
          ) : (
            <>
              <Lock className="w-5 h-5" />
              Ganti Password
            </>
          )}
        </button>
      </form>
    </div>
  );
}
