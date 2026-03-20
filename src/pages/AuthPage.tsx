import { useState } from 'react';
import { User, Mail, LogIn, UserPlus, Loader2, Lock } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { registerContributor, loginContributor } from '../api/tierLists';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from '@tanstack/react-router';

const API_BASE = import.meta.env.DEV ? '' : 'https://mlbbapi.project-n.site';

export function AuthPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!loginEmail.trim()) {
      setError('Masukkan email kamu');
      return;
    }

    if (!loginPassword) {
      setError('Masukkan password kamu');
      return;
    }

    setIsLoading(true);
    try {
      const { contributor, token } = await loginContributor(loginEmail.trim(), loginPassword);
      login(token, { id: contributor.id, name: contributor.name, email: contributor.email || '' });

      // Redirect to home or previous page
      navigate({ to: '/' });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError('');
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: tokenResponse.access_token }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login Google gagal');
        login(data.token, {
          id: data.contributor.id,
          name: data.contributor.name,
          email: data.contributor.email || '',
          avatar: data.contributor.avatar,
        });
        navigate({ to: '/' });
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => setError('Login Google gagal'),
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!registerName.trim()) {
      setError('Masukkan nama kamu');
      return;
    }

    if (!registerEmail.trim()) {
      setError('Masukkan email kamu');
      return;
    }

    if (!registerPassword || registerPassword.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    setIsLoading(true);
    try {
      const { contributor, token } = await registerContributor({
        name: registerName.trim(),
        email: registerEmail.trim(),
        password: registerPassword,
      });

      login(token, { id: contributor.id, name: contributor.name, email: contributor.email || '' });

      // Redirect to home
      navigate({ to: '/' });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-400">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 pt-20 md:pt-28 pb-12">
      <div className="max-w-md mx-auto">
        <div className="card-hover p-5 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-center mb-4 md:mb-6">
            <div className="p-2.5 md:p-3 bg-primary-500/20 rounded-full">
              <User className="w-10 h-10 md:w-12 md:h-12 text-primary-400" />
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold mb-2 text-center">
            {activeTab === 'login' ? 'Selamat Datang Kembali' : 'Bergabung dengan MLBB Hub'}
          </h1>
          <p className="text-gray-400 text-center mb-8">
            {activeTab === 'login'
              ? 'Masuk untuk melacak kontribusi dan tier list kamu'
              : 'Buat akun untuk mulai berkontribusi'}
          </p>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 p-1 bg-dark-50 rounded-lg">
            <button
              onClick={() => {
                setActiveTab('login');
                setError('');
              }}
              className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'login'
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Masuk
            </button>
            <button
              onClick={() => {
                setActiveTab('register');
                setError('');
              }}
              className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'register'
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Daftar
            </button>
          </div>

          {/* Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Alamat Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full pl-11 pr-4 py-3 bg-dark-50 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 text-white"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Masukkan password kamu"
                    className="w-full pl-11 pr-4 py-3 bg-dark-50 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 text-white"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !loginEmail.trim() || !loginPassword}
                className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sedang masuk...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Masuk
                  </>
                )}
              </button>
            </form>
          )}

          {/* Register Form */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Nama Tampilan <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    placeholder="Nama kamu"
                    className="w-full pl-11 pr-4 py-3 bg-dark-50 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 text-white"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Alamat Email <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full pl-11 pr-4 py-3 bg-dark-50 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 text-white"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-11 pr-4 py-3 bg-dark-50 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 text-white"
                    disabled={isLoading}
                  />
                </div>
                <p className="mt-1.5 text-xs text-gray-500">
                  Minimal 6 karakter
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !registerName.trim() || !registerEmail.trim() || !registerPassword || registerPassword.length < 6}
                className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Membuat akun...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Buat Akun
                  </>
                )}
              </button>
            </form>
          )}

          {/* Google Login */}
          <div className="mt-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-gray-500">atau lanjutkan dengan</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => handleGoogleLogin()}
                disabled={isLoading}
                className="flex items-center gap-3 px-6 py-2.5 bg-white hover:bg-gray-100 disabled:opacity-50 text-gray-800 font-medium text-sm rounded-full transition-colors shadow-sm"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
                </svg>
                Lanjutkan dengan Google
              </button>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-white/10">
            <p className="text-[10px] md:text-xs text-gray-500 text-center">
              Dengan melanjutkan, kamu menyetujui pelacakan kontribusi dan namamu akan tampil di leaderboard
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
