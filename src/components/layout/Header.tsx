import { Link, useLocation } from '@tanstack/react-router';
import { Menu, X, ChevronDown, LogOut, LogIn, LayoutDashboard, BarChart3, Shield, Trophy, UserPlus, Home, Users, Layers, Sparkles, Zap, CreditCard, Swords, Gem, Target, Map, Combine } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../hooks/useUser';

const mainNav = [
  { name: 'Hero', href: '/heroes' },
  { name: 'Tier List', href: '/tier-list' },
  { name: 'Patch Notes', href: '/patch-notes' },
  { name: 'Skin', href: '/skins' },
  { name: 'Komunitas', href: '/community' },
];

const moreNavGroups = [
  {
    label: 'Alat Game',
    items: [
      { name: 'Counter Picks', href: '/counters', icon: Shield },
      { name: 'Draft Pick', href: '/draft', icon: Target },
      { name: 'Build Playground', href: '/playground', icon: Layers },
      { name: 'Item Synergy', href: '/item-synergy', icon: Combine },
      { name: 'Turnamen', href: '/tournament/', icon: Trophy },
      { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Konten',
    items: [
      { name: 'Skin', href: '/skins', icon: Sparkles },
      { name: 'Item', href: '/items', icon: Swords },
      { name: 'Emblem', href: '/arcana', icon: Gem },
      // { name: 'OST', href: '/ost', icon: Music2 }, // hidden - belum ada data ML
    ],
  },
  {
    label: 'Komunitas',
    items: [
      { name: 'Kontributor', href: '/contributors', icon: Trophy },
      { name: 'Kontribusi', href: '/contribute', icon: UserPlus },
      { name: 'Roadmap', href: '/roadmap', icon: Map },
    ],
  },
];

// flat list reused for mobile menu (OST included via moreNavGroups spread)
const moreNav = [
  ...moreNavGroups.flatMap(g => g.items),
  { name: 'Top Up', href: 'https://magertopup.com', icon: CreditCard, external: true },
];

// Mobile bottom navigation
const mobileBottomNav = [
  { name: 'Beranda', href: '/', icon: Home },
  { name: 'Hero', href: '/heroes', icon: Users },
  { name: 'Tier List', href: '/tier-list', icon: Layers },
  { name: 'Patch', href: '/patch-notes', icon: Zap },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, logout: authLogout } = useAuth();
  const { data: user } = useUser();
  const location = useLocation();

  // Handle scroll effect - only for desktop
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    authLogout();
    setUserMenuOpen(false);
  };

  return (
    <>
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-dark-400/95 backdrop-blur-xl border-b border-white/5'
          : 'md:bg-transparent bg-dark-400/95 md:backdrop-blur-none backdrop-blur-xl'
      }`}
    >
      <nav className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2.5 group">
            <img
              src="/mlbbhub.webp"
              alt=""
              aria-hidden="true"
              className="w-9 h-9 object-contain group-hover:scale-110 transition-transform duration-300"
            />
            <span className="text-xl font-display font-semibold text-white">
              <span className="text-primary-400">MLBB</span> Hub
            </span>
          </Link>

          {/* Desktop Navigation - Center */}
          <div className="hidden md:flex items-center space-x-1">
            {mainNav.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="px-5 py-2.5 text-[15px] text-gray-300 hover:text-white transition-colors duration-200"
                activeProps={{
                  className: 'text-white',
                }}
              >
                {item.name}
              </Link>
            ))}

            {/* More Dropdown */}
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                className="flex items-center gap-1.5 px-5 py-2.5 text-[15px] text-gray-300 hover:text-white transition-colors duration-200"
              >
                <span>Lainnya</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${moreMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {moreMenuOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[480px] bg-dark-300/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-5">
                  <div className="grid grid-cols-3 gap-6">
                    {moreNavGroups.map((group) => (
                      <div key={group.label}>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                          {group.label}
                        </p>
                        <div className="space-y-0.5">
                          {group.items.map((item) => (
                            <Link
                              key={item.name}
                              to={item.href}
                              className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                              onClick={() => setMoreMenuOpen(false)}
                            >
                              <item.icon className="w-4 h-4 text-gray-500 shrink-0" />
                              <span className="whitespace-nowrap">{item.name}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Top Up CTA */}
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <a
                      href="https://magertopup.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 px-3 py-2.5 bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/20 rounded-xl text-primary-400 text-sm transition-colors"
                      onClick={() => setMoreMenuOpen(false)}
                    >
                      <CreditCard className="w-4 h-4 shrink-0" />
                      <span>Top Up Games</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Auth */}
          <div className="hidden md:flex items-center">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-white/5 transition-colors duration-200"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-[15px] text-gray-300">{user.name}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-dark-300/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-white/10">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Masuk sebagai</p>
                        <p className="font-medium text-white truncate mt-1">{user.name}</p>
                      </div>
                      <div className="py-2">
                        <Link
                          to="/dashboard"
                          className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <LayoutDashboard className="w-4 h-4 text-gray-500" />
                          <span>Dashboard</span>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Keluar</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                to="/auth"
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-dark-400 rounded-xl text-[15px] font-medium hover:bg-gray-100 transition-colors duration-200"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk</span>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Fullscreen Menu */}
        {mobileMenuOpen && (
          <>
            {/* Solid backdrop to cover everything */}
            <div className="md:hidden fixed inset-0 z-[100] bg-[#0a0e27]" />

            {/* Menu content */}
            <div className="md:hidden fixed inset-0 z-[101]">
              {/* Header */}
              <div className="flex items-center justify-between px-4 h-16 border-b border-white/10 bg-[#0a0e27]">
                <span className="text-lg font-semibold text-white">Menu</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Menu Content */}
              <div className="overflow-y-auto h-[calc(100vh-4rem)] pb-20 bg-[#0a0e27]">
                <div className="p-4 space-y-2">
                  {/* User Profile Card */}
                  {isAuthenticated && user ? (
                    <div className="p-4 bg-gradient-to-r from-primary-500/20 to-purple-500/20 rounded-2xl border border-primary-500/30 mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                          <span className="text-xl font-bold text-white">{user.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-white text-lg">{user.name}</p>
                          <p className="text-sm text-gray-400">Kontributor</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Link
                      to="/auth"
                      className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl mb-4"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                        <LogIn className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">Masuk / Daftar</p>
                        <p className="text-sm text-white/70">Bergabung dengan komunitas</p>
                      </div>
                    </Link>
                  )}

                  {/* Quick Actions */}
                  <p className="text-xs text-gray-500 uppercase tracking-wider px-2 pt-4 pb-2">Akses Cepat</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[...mainNav, { name: 'Analytics', href: '/analytics' }].map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className="flex items-center justify-center p-4 bg-[#111631] rounded-xl border border-white/5 hover:border-primary-500/30 transition-all"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span className="text-white font-medium">{item.name}</span>
                      </Link>
                    ))}
                  </div>

                  {/* More Options */}
                  <p className="text-xs text-gray-500 uppercase tracking-wider px-2 pt-6 pb-2">Lainnya</p>
                  <div className="space-y-1">
                    {moreNav.map((item) => (
                      'external' in item && item.external ? (
                        <a
                          key={item.name}
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-4 p-4 bg-[#0d1229] rounded-xl border border-white/5 hover:border-primary-500/30 transition-all"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <div className="w-10 h-10 bg-[#1a1f3a] rounded-xl flex items-center justify-center">
                            <item.icon className="w-5 h-5 text-primary-400" />
                          </div>
                          <span className="text-white font-medium">{item.name}</span>
                        </a>
                      ) : (
                        <Link
                          key={item.name}
                          to={item.href}
                          className="flex items-center gap-4 p-4 bg-[#0d1229] rounded-xl border border-white/5 hover:border-primary-500/30 transition-all"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <div className="w-10 h-10 bg-[#1a1f3a] rounded-xl flex items-center justify-center">
                            <item.icon className="w-5 h-5 text-primary-400" />
                          </div>
                          <span className="text-white font-medium">{item.name}</span>
                        </Link>
                      )
                    ))}
                  </div>

                  {/* Account Actions */}
                  {isAuthenticated && user && (
                    <>
                      <p className="text-xs text-gray-500 uppercase tracking-wider px-2 pt-6 pb-2">Akun</p>
                      <div className="space-y-1">
                        <Link
                          to="/dashboard"
                          className="flex items-center gap-4 p-4 bg-[#0d1229] rounded-xl border border-white/5"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <div className="w-10 h-10 bg-[#1a1f3a] rounded-xl flex items-center justify-center">
                            <LayoutDashboard className="w-5 h-5 text-blue-400" />
                          </div>
                          <span className="text-white font-medium">Dashboard</span>
                        </Link>
                        <button
                          onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                          className="w-full flex items-center gap-4 p-4 bg-red-900/30 rounded-xl border border-red-500/20"
                        >
                          <div className="w-10 h-10 bg-red-900/50 rounded-xl flex items-center justify-center">
                            <LogOut className="w-5 h-5 text-red-400" />
                          </div>
                          <span className="text-red-400 font-medium">Keluar</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </nav>
    </header>

    {/* Mobile Bottom Navigation */}
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-dark-400/95 backdrop-blur-xl border-t border-white/10 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {mobileBottomNav.map((item) => {
          const isActive = location.pathname === item.href ||
            (item.href !== '/' && location.pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors ${
                isActive ? 'text-primary-500' : 'text-gray-500'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-primary-500' : 'text-gray-500'}`} />
              <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-primary-500' : 'text-gray-500'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
        {/* More button */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-2 text-gray-500"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium">Lainnya</span>
        </button>
      </div>
    </nav>
    </>
  );
}
