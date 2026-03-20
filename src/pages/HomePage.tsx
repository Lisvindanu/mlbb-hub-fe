import { Link } from '@tanstack/react-router';
import { ArrowRight, ArrowDown, Users, Crown, Palette, Shield, Zap, Layers, Package, BarChart2, AlertTriangle, X, Music2 } from 'lucide-react';
import { useHeroes } from '../hooks/useHeroes';
import { motion } from 'framer-motion';
import { useState } from 'react';

function TrakteerMobileSection() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <section className="md:hidden py-10 border-t border-white/5">
        <div className="container mx-auto px-6">
          <motion.div
            className="flex flex-col items-center text-center gap-4 p-6 rounded-2xl"
            style={{ background: 'rgba(190,30,45,0.08)', border: '1px solid rgba(190,30,45,0.2)' }}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <img
              src="https://edge-cdn.trakteer.id/images/embed/trbtn-icon.png?v=14-05-2025"
              alt="Trakteer"
              className="w-10 h-10 object-contain"
              style={{ aspectRatio: '1/1' }}
            />
            <div>
              <h3 className="text-white font-bold text-lg mb-1">Dukung MLBB Hub</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                MLBB Hub gratis untuk semua. Kalau kamu suka, traktir sebentar ya!
              </p>
            </div>
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-transform active:scale-95"
              style={{ backgroundColor: '#be1e2d' }}
            >
              <img
                src="https://edge-cdn.trakteer.id/images/embed/trbtn-icon.png?v=14-05-2025"
                alt=""
                className="w-4 h-4 object-contain"
                style={{ aspectRatio: '1/1' }}
              />
              Traktir Sekarang
            </button>
          </motion.div>
        </div>
      </section>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            className="relative flex flex-col rounded-2xl overflow-hidden shadow-2xl"
            style={{ width: 'min(480px, calc(100vw - 2rem))', height: 'min(600px, calc(100vh - 4rem))' }}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            >
              <X size={16} />
            </button>
            <iframe
              src="https://trakteer.id/v1/lisvindanu-sftvm/tip/embed/modal"
              className="h-full w-full border-0"
              allow="payment"
              title="Dukung MLBB Hub di Trakteer"
            />
          </div>
        </div>
      )}
    </>
  );
}

export function HomePage() {
  const { data: heroes } = useHeroes();
  const [bannerDismissed, setBannerDismissed] = useState(
    () => localStorage.getItem('incident-banner-dismissed') === '1'
  );

  const dismissBanner = () => {
    localStorage.setItem('incident-banner-dismissed', '1');
    setBannerDismissed(true);
  };

  const features = [
    {
      icon: Users,
      title: 'Database Hero',
      description: '111+ hero dengan statistik, skill, rekomendasi equipment & arcana',
      href: '/heroes',
      color: 'from-blue-500 to-blue-700',
    },
    {
      icon: Crown,
      title: 'Tier List',
      description: 'Peringkat tier pilihan komunitas dengan voting, komentar & diskusi meta',
      href: '/tier-list',
      color: 'from-amber-400 to-orange-600',
    },
    {
      icon: Shield,
      title: 'Counter Picks',
      description: 'Temukan counter terbaik, sinergi & matchup kuat untuk setiap hero',
      href: '/counters',
      color: 'from-red-500 to-rose-700',
    },
    {
      icon: Palette,
      title: 'Galeri Skin',
      description: 'Jelajahi 1000+ skin — filter eksklusif, terbatas, seri & kolaborasi',
      href: '/skins',
      color: 'from-pink-500 to-purple-600',
    },
    {
      icon: Zap,
      title: 'Patch Notes',
      description: 'Lacak setiap buff, nerf & penyesuaian hero di semua patch',
      href: '/patch-notes',
      color: 'from-green-500 to-emerald-700',
    },
    {
      icon: Layers,
      title: 'Simulasi Draft',
      description: 'Latih picks & bans sebelum ranked dengan mode draft lengkap',
      href: '/draft',
      color: 'from-violet-500 to-indigo-700',
    },
    {
      icon: Package,
      title: 'Item & Arcana',
      description: 'Database lengkap semua item dan build arcana untuk setiap role',
      href: '/items',
      color: 'from-cyan-500 to-teal-700',
    },
    {
      icon: BarChart2,
      title: 'Analytics',
      description: 'Win rate, pick rate & tren meta untuk mempertajam strategimu',
      href: '/analytics',
      color: 'from-orange-400 to-rose-600',
    },
  ];

  const heroCount = heroes?.length || 111;
  const skinCount = heroes?.reduce((acc, h) => acc + (h.skins?.length || 0), 0) || 1394;

  return (
    <div className="min-h-screen bg-dark-400">

      {/* Incident Banner — hidden */}
      )}

      {/* Hero Section - Full Height */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="/mlbbhub.webp"
            alt="Mobile Legends: Bang Bang Heroes"
            className="w-full h-full object-cover"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-dark-400/70 via-dark-400/50 to-dark-400" />
          <div className="absolute inset-0 bg-gradient-to-r from-dark-400/80 via-transparent to-dark-400/80" />
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 md:px-6 lg:px-8 text-center pt-16 md:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            {/* Badge */}
            <div className="inline-flex items-center px-3 md:px-4 py-1.5 md:py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full mb-6 md:mb-8">
              <span className="text-xs md:text-sm text-white/90 font-medium">Teman Terbaik ML Kamu</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-display font-bold text-white mb-4 md:mb-6 tracking-tight">
              <span className="block">Master the</span>
              <span className="block bg-gradient-to-r from-primary-400 via-primary-300 to-blue-400 bg-clip-text text-transparent">
                Meta
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base md:text-lg lg:text-xl text-white/70 max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed px-4">
              Semua yang kamu butuhkan untuk mendominasi Mobile Legends: Bang Bang.
              Statistik hero, tier list, counter, dan lebih banyak lagi.
            </p>

            {/* CTAs - Stack on mobile */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 px-4">
              <Link
                to="/heroes"
                className="group w-full sm:w-auto flex items-center justify-center gap-2 md:gap-3 px-6 md:px-8 py-3.5 md:py-4 bg-white text-dark-400 rounded-xl md:rounded-2xl text-base md:text-lg font-semibold hover:bg-gray-100 transition-all duration-300"
              >
                <span>Jelajahi Hero</span>
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/tier-list"
                className="w-full sm:w-auto flex items-center justify-center gap-2 md:gap-3 px-6 md:px-8 py-3.5 md:py-4 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-xl md:rounded-2xl text-base md:text-lg font-medium hover:bg-white/20 transition-all duration-300"
              >
                <Crown className="w-4 h-4 md:w-5 md:h-5" />
                <span>Lihat Tier List</span>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator - Hidden on mobile */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 hidden md:block"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <div className="flex flex-col items-center gap-3 text-white/50">
            <span className="text-sm tracking-wide uppercase">Gulir untuk menjelajahi</span>
            <ArrowDown className="w-5 h-5 animate-bounce" />
          </div>
        </motion.div>
      </section>

      {/* Stats Section - Minimal */}
      <section className="py-12 md:py-20 border-b border-white/5">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 lg:gap-12">
            <motion.div
              className="text-center p-4 md:p-0"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-1 md:mb-2">
                {heroCount}
              </div>
              <p className="text-gray-500 text-xs md:text-sm uppercase tracking-wide">Hero</p>
            </motion.div>
            <motion.div
              className="text-center p-4 md:p-0"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-1 md:mb-2">
                {skinCount}+
              </div>
              <p className="text-gray-500 text-xs md:text-sm uppercase tracking-wide">Skin</p>
            </motion.div>
            <motion.div
              className="text-center p-4 md:p-0"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-1 md:mb-2">
                6
              </div>
              <p className="text-gray-500 text-xs md:text-sm uppercase tracking-wide">Role</p>
            </motion.div>
            <motion.div
              className="text-center p-4 md:p-0"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-1 md:mb-2">
                24/7
              </div>
              <p className="text-gray-500 text-xs md:text-sm uppercase tracking-wide">Diperbarui</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section - Glassmorphism */}
      <section className="py-24 relative overflow-hidden">
        {/* Background glow orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-primary-500/[0.07] rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-500/[0.07] rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/[0.05] rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
              Semua yang kamu butuhkan
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Semua alat untuk mendominasi Rift — panduan hero, tier list, draft & lebih banyak lagi
            </p>
          </motion.div>

          {/* Feature Cards — glass grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.07 }}
                className="h-full"
              >
                <Link
                  to={feature.href}
                  className="group relative flex flex-col h-full p-5 md:p-6 rounded-3xl
                    bg-white/[0.04] backdrop-blur-xl
                    border border-white/[0.08]
                    shadow-[inset_0_1px_0_0_rgba(255,255,255,0.07)]
                    hover:bg-white/[0.08] hover:border-white/[0.16]
                    hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_24px_48px_-12px_rgba(0,0,0,0.4)]
                    transition-all duration-300"
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg`}>
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-sm md:text-base font-semibold text-white mb-1.5 group-hover:text-primary-300 transition-colors">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-gray-500 leading-relaxed flex-1">
                    {feature.description}
                  </p>

                  {/* Explore link */}
                  <div className="mt-4 flex items-center gap-1 text-xs text-gray-600 group-hover:text-primary-400 transition-all">
                    <span>Jelajahi</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* OST Spotlight Section - hidden, belum ada data ML */}
      {false && <section className="py-20 relative overflow-hidden border-t border-white/5">
        {/* Glow background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/[0.10] rounded-full blur-[130px]" />
          <div className="absolute top-1/2 right-1/3 -translate-y-1/2 w-[400px] h-[400px] bg-pink-600/[0.07] rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

            {/* Vinyl + Album Art */}
            <motion.div
              className="flex-shrink-0"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative" style={{ width: 300, height: 240 }}>
                {/* Spinning vinyl disc */}
                <motion.div
                  className="absolute rounded-full"
                  style={{
                    width: 240, height: 240,
                    left: 0, top: 0,
                    background: 'radial-gradient(circle at center, #2a2a2a 28%, #111 28.5%, #1a1a1a 35%, #111 35.5%, #1a1a1a 42%, #111 42.5%, #1a1a1a 49%, #111 49.5%, #222 50%)',
                    boxShadow: '0 0 0 2px rgba(255,255,255,0.05), 0 20px 60px rgba(0,0,0,0.8), 0 0 80px rgba(147,51,234,0.15)',
                    zIndex: 1,
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                >
                  {[28, 42, 56, 70, 84].map(r => (
                    <div key={r} className="absolute inset-0 rounded-full border"
                      style={{ margin: r * 240 / 320, borderColor: 'rgba(255,255,255,0.03)' }} />
                  ))}
                  <div className="absolute inset-0 rounded-full"
                    style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)' }} />
                  <div className="absolute rounded-full" style={{
                    width: 14, height: 14, top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: '#080808',
                    boxShadow: '0 0 0 2px rgba(255,255,255,0.06)',
                  }} />
                </motion.div>

                {/* Static album art */}
                <div className="absolute rounded-2xl overflow-hidden" style={{
                  width: 200, height: 200,
                  left: 100, top: 20,
                  zIndex: 2,
                  boxShadow: '-16px 0 40px rgba(0,0,0,0.7), 0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
                }}>
                  <img
                    src="https://img.youtube.com/vi/HaIKxmA5Jso/hqdefault.jpg"
                    alt="Born to Rise"
                    className="w-full h-full object-cover"
                  />
                  {/* Now playing overlay */}
                  <div className="absolute bottom-0 left-0 right-0 px-3 py-2"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }}>
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-end gap-0.5 h-3">
                        {[0, 0.2, 0.1].map((d, i) => (
                          <motion.div key={i} className="w-0.5 rounded-full bg-purple-400"
                            animate={{ height: ['4px', '10px', '4px'] }}
                            transition={{ duration: 0.8, delay: d, repeat: Infinity }} />
                        ))}
                      </div>
                      <span className="text-[10px] text-white/70 font-medium">Born to Rise</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Content */}
            <motion.div
              className="flex-1 text-center lg:text-left"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
                style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)' }}>
                <Music2 className="w-3.5 h-3.5" style={{ color: '#c084fc' }} />
                <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: '#c084fc' }}>Soundtrack Resmi</span>
              </div>

              <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-3">
                Mobile Legends: Bang Bang OST
              </h2>
              <p className="text-gray-400 leading-relaxed mb-8 max-w-md mx-auto lg:mx-0">
                Putar 34 lagu resmi — dari lagu kebangsaan global oleh Joe Hisaishi hingga tema karakter,
                skor sinematik & soundtrack kolaborasi. Semua dalam satu pemutar.
              </p>

              {/* Album category pills */}
              <div className="grid grid-cols-2 gap-2 mb-8 max-w-sm mx-auto lg:mx-0">
                {[
                  { label: 'Global & Anniversary', count: '8 lagu', c: 'rgba(251,191,36,0.1)', b: 'rgba(251,191,36,0.2)', t: '#fbbf24' },
                  { label: 'Skor Sinematik',        count: '8 lagu', c: 'rgba(99,102,241,0.1)',  b: 'rgba(99,102,241,0.2)',  t: '#818cf8' },
                  { label: 'Tema Karakter',         count: '8 lagu', c: 'rgba(34,197,94,0.1)',   b: 'rgba(34,197,94,0.2)',   t: '#4ade80' },
                  { label: 'Event & Kolaborasi',    count: '10 lagu', c: 'rgba(236,72,153,0.1)', b: 'rgba(236,72,153,0.2)',  t: '#f472b6' },
                ].map(({ label, count, c, b, t }) => (
                  <div key={label} className="flex flex-col px-3 py-2.5 rounded-xl text-left"
                    style={{ background: c, border: `1px solid ${b}` }}>
                    <span className="text-[11px] font-semibold" style={{ color: t }}>{count}</span>
                    <span className="text-xs font-medium text-white/80 mt-0.5 leading-tight">{label}</span>
                  </div>
                ))}
              </div>

              <Link
                to="/ost"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl font-semibold text-sm text-white transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_12px_40px_rgba(147,51,234,0.5)]"
                style={{ background: 'linear-gradient(135deg, #9333ea, #ec4899)', boxShadow: '0 8px 28px rgba(147,51,234,0.35)' }}
              >
                <Music2 className="w-4 h-4" />
                Dengarkan Sekarang
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>}

      <TrakteerMobileSection />

      {/* CTA Section */}
      <section className="py-24 border-t border-white/5">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">
              Siap naik peringkat?
            </h2>
            <p className="text-gray-400 text-lg mb-10">
              Bergabunglah dengan komunitas kami dan mulai tingkatkan permainanmu hari ini.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/heroes"
                className="group flex items-center gap-3 px-8 py-4 bg-primary-500 text-white rounded-2xl text-lg font-semibold hover:bg-primary-600 transition-all duration-300"
              >
                <span>Mulai Sekarang</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/contribute"
                className="flex items-center gap-3 px-8 py-4 text-gray-300 hover:text-white transition-colors"
              >
                <span>Kontribusi ke MLBB Hub</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
