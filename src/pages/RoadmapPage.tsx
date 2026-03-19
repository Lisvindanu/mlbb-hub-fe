import { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, type Variants } from 'framer-motion';
import {
  CheckCircle2,
  Sparkles,
  Rocket,
  Users,
  Wrench,
  Palette,
  Globe,
  Zap,
  Swords,
  Target,
  MessageSquare,
  ArrowDown,
  Calendar,
} from 'lucide-react';
import { Link } from '@tanstack/react-router';

// ─── Data ────────────────────────────────────────────────────────────────────

interface Milestone {
  label: string;
}

interface Phase {
  num: string;
  title: string;
  period: string;
  color: string;       // tailwind gradient class
  glowColor: string;   // rgba for box-shadow glow
  icon: React.ElementType;
  milestones: Milestone[];
}

const PHASES: Phase[] = [
  {
    num: '01',
    title: 'Fondasi',
    period: '21 Feb 2026',
    color: 'from-blue-500 to-cyan-400',
    glowColor: 'rgba(59,130,246,0.15)',
    icon: Rocket,
    milestones: [
      { label: 'Platform MLBB Hub — launch awal' },
      { label: 'Database heroes, tier list, item' },
      { label: 'Sistem login & register' },
      { label: 'Dashboard pengguna' },
      { label: 'Counter pick guide' },
    ],
  },
  {
    num: '02',
    title: 'Game Tools',
    period: 'Feb 2026',
    color: 'from-primary-500 to-violet-500',
    glowColor: 'rgba(139,92,246,0.15)',
    icon: Wrench,
    milestones: [
      { label: 'Draft Pick Simulator — role-based picking' },
      { label: 'Draft Pick — switch side per game' },
      { label: 'Hero Build Playground — sim arcana + item' },
      { label: 'Playground — stats breakdown (Item vs Arcana)' },
      { label: 'Playground — save & share build via URL' },
      { label: 'Item Synergy Checker — konflik passive detection' },
    ],
  },
  {
    num: '03',
    title: 'Konten & Media',
    period: 'Feb – Mar 2026',
    color: 'from-rose-500 to-orange-400',
    glowColor: 'rgba(244,63,94,0.15)',
    icon: Palette,
    milestones: [
      { label: 'Patch Notes — season selector + balance history' },
      { label: 'Skin Gallery — koleksi skin per hero' },
      { label: 'OST Music Player — 34 lagu + vinyl animation' },
      { label: 'Emblem Explorer — detail set emblem' },
      { label: 'Items Explorer — detail item + stats' },
      { label: 'Analytics — winrate & pickrate tracking' },
      { label: 'Custom Tier List — buat, drag & drop, share, download' },
    ],
  },
  {
    num: '04',
    title: 'Community',
    period: 'Mar 2026',
    color: 'from-emerald-500 to-teal-400',
    glowColor: 'rgba(16,185,129,0.15)',
    icon: Users,
    milestones: [
      { label: 'Community Board — posts, replies, likes' },
      { label: 'Dev Updates — panel admin + pengumuman resmi' },
      { label: 'Reply edit & post edit' },
      { label: 'Contributors page — showcase kontributor' },
      { label: 'Feedback & saran langsung ke dev' },
      { label: 'Trakteer widget — support MLBB Hub' },
    ],
  },
  {
    num: '05',
    title: 'Polesan & SEO',
    period: 'Mar 2026',
    color: 'from-yellow-400 to-amber-500',
    glowColor: 'rgba(234,179,8,0.12)',
    icon: Globe,
    milestones: [
      { label: 'Redesign UI 2026 — dark luxury aesthetic' },
      { label: 'SEO optimization — meta, sitemap, canonical' },
      { label: 'Mega menu — grouped navigation' },
      { label: 'Mobile bottom nav — quick access' },
      { label: 'Incident page — status & downtime tracker' },
      { label: 'Roadmap page (halaman ini!)' },
    ],
  },
];

const COMING_NEXT = [
  {
    title: 'Hero Comparison Tool',
    desc: 'Bandingkan 2 hero secara head-to-head — stats, role, dan counter',
    icon: Swords,
  },
  {
    title: 'Team Composition Builder',
    desc: 'Simulasi komposisi tim meta dengan saran role & sinergy otomatis',
    icon: Users,
  },
  {
    title: 'Notifikasi Patch Notes',
    desc: 'Dapat notif langsung saat patch baru rilis tanpa harus cek manual',
    icon: Zap,
  },
  {
    title: 'Match History & Rank Tracker',
    desc: 'Pantau rank dan statistik match kamu langsung dari MLBB Hub',
    icon: Target,
  },
];

// ─── Milestone stagger variants ───────────────────────────────────────────────

const listVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

// ─── PhaseSection ─────────────────────────────────────────────────────────────

function PhaseSection({ phase, index }: { phase: Phase; index: number }) {
  const isEven = index % 2 === 0;
  const done = phase.milestones.length;
  const total = phase.milestones.length;

  return (
    <div className="relative py-20 md:py-28">
      {/* Giant background number */}
      <div
        className={`
          absolute top-1/2 -translate-y-1/2 select-none pointer-events-none
          text-[200px] md:text-[280px] font-display font-black leading-none
          ${isEven ? 'right-0 translate-x-[20%]' : 'left-0 -translate-x-[20%]'}
        `}
      >
        <span
          className={`bg-clip-text text-transparent bg-gradient-to-br ${phase.color}`}
          style={{ opacity: 0.055 }}
        >
          {phase.num}
        </span>
      </div>

      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-5xl relative z-10">
        <motion.div
          className={`
            flex flex-col gap-8 md:gap-12
            ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}
            items-start
          `}
          initial={{ opacity: 0, x: isEven ? -50 : 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* ── Left/Right: Phase meta ── */}
          <div className="flex-shrink-0 md:w-52">
            {/* Icon */}
            <div
              className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${phase.color} flex items-center justify-center shadow-xl mb-5`}
              style={{ boxShadow: `0 8px 32px ${phase.glowColor}` }}
            >
              <phase.icon className="w-7 h-7 text-white" />
            </div>

            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.25em] mb-1">
              Phase {phase.num}
            </p>
            <h3 className="text-[26px] font-display font-bold text-white leading-tight mb-2">
              {phase.title}
            </h3>

            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-5">
              <Calendar className="w-3 h-3" />
              <span>{phase.period}</span>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between text-[11px] text-gray-600">
                <span>Milestone</span>
                <span className="text-gray-400 font-medium">{done}/{total}</span>
              </div>
              <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${phase.color}`}
                  initial={{ width: 0 }}
                  whileInView={{ width: '100%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: 0.4, ease: 'easeOut' }}
                />
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 font-semibold">
              <CheckCircle2 className="w-3 h-3" />
              Selesai
            </span>
          </div>

          {/* ── Right/Left: Milestone list ── */}
          <motion.ul
            className="flex-1 space-y-2.5 w-full"
            variants={listVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
          >
            {phase.milestones.map((m, i) => (
              <motion.li
                key={i}
                variants={itemVariants}
                className="group flex items-center gap-3.5 p-3.5 rounded-xl bg-white/[0.025] border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/[0.10] transition-all duration-300"
              >
                <div
                  className={`flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br ${phase.color} flex items-center justify-center`}
                  style={{ boxShadow: `0 0 12px ${phase.glowColor}` }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors duration-200 leading-snug">
                  {m.label}
                </span>
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>
      </div>

      {/* Connector dot on center line */}
      <motion.div
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center justify-center`}
        initial={{ scale: 0, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div
          className={`w-4 h-4 rounded-full bg-gradient-to-br ${phase.color} ring-4 ring-[#050914]`}
          style={{ boxShadow: `0 0 20px ${phase.glowColor}` }}
        />
      </motion.div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function RoadmapPage() {
  useEffect(() => {
    document.title = 'Project Roadmap | MLBB Hub';
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', 'MLBB Hub development roadmap. See what features have been built and what is coming next.');
    return () => { document.title = 'MLBB Hub - Mobile Legends: Bang Bang Community Hub'; };
  }, []);

  const heroRef = useRef<HTMLDivElement>(null);

  // Global page scroll progress → animated top bar
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 80, damping: 20, restDelta: 0.001 });

  // Hero parallax
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroY      = useTransform(heroScroll, [0, 1], ['0%', '35%']);
  const heroOpacity = useTransform(heroScroll, [0, 0.75], [1, 0]);
  const titleScale  = useTransform(heroScroll, [0, 1], [1, 0.92]);

  return (
    <div className="bg-[#060a1a] text-white overflow-x-hidden">

      {/* ── Scroll progress bar ── */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] z-[100] origin-left"
        style={{
          scaleX,
          background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #d946ef)',
        }}
      />

      {/* ═══════════ HERO ═══════════ */}
      <section
        ref={heroRef}
        className="relative h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Parallax background blobs */}
        <motion.div style={{ y: heroY }} className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[15%] left-[15%] w-[700px] h-[700px] rounded-full blur-[160px]"
            style={{ background: 'rgba(99,102,241,0.12)' }} />
          <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] rounded-full blur-[130px]"
            style={{ background: 'rgba(139,92,246,0.10)' }} />
          <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] rounded-full blur-[200px]"
            style={{ background: 'rgba(14,20,60,0.5)' }} />
        </motion.div>

        {/* Subtle grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
          }}
        />

        {/* Hero content */}
        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative z-10 text-center px-4 pt-16 md:pt-20"
        >
          {/* Date badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 border"
            style={{
              background: 'rgba(255,255,255,0.05)',
              borderColor: 'rgba(255,255,255,0.1)',
            }}
          >
            <Calendar className="w-3.5 h-3.5 text-primary-400" />
            <span className="text-sm text-white/60 font-medium">Dimulai 21 Feb 2026</span>
          </motion.div>

          {/* Big title */}
          <motion.div
            style={{ scale: titleScale }}
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="text-[68px] sm:text-[96px] md:text-[136px] lg:text-[160px] font-display font-black leading-none tracking-tight">
              <span className="text-white">ML</span>
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 40%, #e879f9 100%)',
                }}
              >
                {' '}Hub
              </span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="mt-4 text-sm md:text-base text-gray-600 tracking-[0.45em] uppercase font-light"
          >
            Project Roadmap
          </motion.p>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.75 }}
            className="mt-14 flex items-center justify-center gap-10 md:gap-20"
          >
            {[
              { value: '5', label: 'Fase Selesai' },
              { value: '30+', label: 'Fitur Live' },
              { value: '11d', label: 'Sprint Pertama' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-white font-display">{s.value}</p>
                <p className="text-[10px] text-gray-600 mt-1.5 uppercase tracking-[0.2em]">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
        >
          <motion.div
            animate={{ y: [0, 7, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="flex flex-col items-center gap-1.5"
          >
            <span className="text-[9px] text-gray-700 uppercase tracking-[0.35em]">Scroll</span>
            <ArrowDown className="w-4 h-4 text-gray-700" />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════ TIMELINE ═══════════ */}
      <section className="relative">
        {/* Center vertical line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px hidden md:block"
          style={{ background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.07) 15%, rgba(255,255,255,0.07) 85%, transparent)' }}
        />

        {/* Section label */}
        <motion.div
          className="container mx-auto px-4 md:px-6 lg:px-8 max-w-5xl pt-16 pb-4"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 md:flex-none md:w-12"
              style={{ background: 'rgba(255,255,255,0.07)' }} />
            <span className="text-[10px] text-gray-600 uppercase tracking-[0.3em] font-semibold">
              Timeline
            </span>
            <div className="h-px flex-1"
              style={{ background: 'rgba(255,255,255,0.07)' }} />
          </div>
        </motion.div>

        {PHASES.map((phase, i) => (
          <PhaseSection key={i} phase={phase} index={i} />
        ))}
      </section>

      {/* ═══════════ COMING NEXT ═══════════ */}
      <section className="relative py-28 md:py-36 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full blur-[160px]"
            style={{ background: 'rgba(109,40,217,0.07)' }} />
        </div>

        {/* Giant "06" watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[240px] md:text-[320px] font-display font-black leading-none select-none pointer-events-none">
          <span className="bg-clip-text text-transparent"
            style={{
              backgroundImage: 'linear-gradient(135deg, #7c3aed, #d946ef)',
              opacity: 0.04,
            }}>
            06
          </span>
        </div>

        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-5xl relative z-10">
          {/* Heading */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 border"
              style={{ background: 'rgba(109,40,217,0.12)', borderColor: 'rgba(139,92,246,0.25)' }}
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-sm text-violet-300 font-semibold">Phase 06</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-4 tracking-tight">
              Selanjutnya
            </h2>
            <p className="text-gray-500 max-w-sm mx-auto text-sm leading-relaxed">
              Fitur yang sedang kami rencanakan untuk update berikutnya
            </p>
          </motion.div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {COMING_NEXT.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="group relative p-6 rounded-2xl border overflow-hidden cursor-default"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  borderColor: 'rgba(255,255,255,0.06)',
                  transition: 'border-color 0.3s, background 0.3s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.35)';
                  (e.currentTarget as HTMLElement).style.background = 'rgba(109,40,217,0.07)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)';
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.025)';
                }}
              >
                {/* Glow blob on hover */}
                <div
                  className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: 'rgba(139,92,246,0.25)' }}
                />

                <div className="relative z-10 flex items-start gap-4">
                  <div
                    className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center border"
                    style={{ background: 'rgba(109,40,217,0.15)', borderColor: 'rgba(139,92,246,0.25)' }}
                  >
                    <item.icon className="w-5 h-5 text-violet-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <h4 className="text-sm font-bold text-white">{item.title}</h4>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full border font-semibold"
                        style={{
                          background: 'rgba(109,40,217,0.15)',
                          borderColor: 'rgba(139,92,246,0.25)',
                          color: '#a78bfa',
                        }}
                      >
                        Direncanakan
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section className="py-20 md:py-28 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <div className="container mx-auto px-4 text-center max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-12 h-12 rounded-2xl mx-auto mb-5 flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <MessageSquare className="w-5 h-5 text-gray-500" />
            </div>
            <h3 className="text-2xl md:text-3xl font-display font-bold text-white mb-3">
              Ada ide fitur baru?
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              Saran kamu bisa masuk ke roadmap berikutnya.<br className="hidden md:block" />
              Sampaikan langsung di Community Board.
            </p>
            <Link
              to="/community"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-semibold text-sm transition-colors"
              style={{ background: 'white', color: '#060a1a' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#e5e7eb')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'white')}
            >
              <Users className="w-4 h-4" />
              Buka Community Board
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Bottom spacer for mobile nav */}
      <div className="h-16 md:h-0" />
    </div>
  );
}
