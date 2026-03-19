import { Link } from '@tanstack/react-router';
import { ArrowRight, Shield, Users, TrendingUp, Code } from 'lucide-react';
import { motion } from 'framer-motion';

export function AboutPage() {
  return (
    <div className="min-h-screen bg-dark-400 py-12 md:py-20">
      <div className="container mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            Tentang MLBB Hub
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Hub lengkap Mobile Legends: Bang Bang, dibangun oleh komunitas untuk komunitas
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-12">
          {/* What is MLBB Hub */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="p-8 rounded-3xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08]"
          >
            <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-6">
              Hub Lengkap Mobile Legends: Bang Bang
            </h2>
            <div className="space-y-5 text-gray-300 leading-relaxed">
              <p>
                <strong className="text-white">MLBB Hub</strong> adalah platform berbasis komunitas untuk pemain <strong className="text-white">Mobile Legends: Bang Bang</strong> di Indonesia dan seluruh dunia. Cari <Link to="/heroes" className="text-primary-400 hover:text-primary-300 underline">panduan hero</Link> lengkap, <Link to="/tier-list" className="text-primary-400 hover:text-primary-300 underline">tier list</Link> terbaru, atau kuasai <Link to="/counters" className="text-primary-400 hover:text-primary-300 underline">counter pick</Link> untuk mendominasi lane-mu.
              </p>
              <p>
                Jelajahi database <strong className="text-white">100+ hero</strong> dengan stat lengkap, breakdown skill, <Link to="/items" className="text-primary-400 hover:text-primary-300 underline">build item</Link>, dan <Link to="/arcana" className="text-primary-400 hover:text-primary-300 underline">rekomendasi emblem</Link>. <Link to="/skins" className="text-primary-400 hover:text-primary-300 underline">Galeri skin</Link> kami mencakup ratusan skin termasuk edisi terbatas, koleksi series, dan skin kolaborasi. Pantau setiap buff, nerf, dan pergeseran meta melalui <Link to="/patch-notes" className="text-primary-400 hover:text-primary-300 underline">patch notes</Link> kami.
              </p>
              <p>
                Latih strategi draft dengan <Link to="/draft" className="text-primary-400 hover:text-primary-300 underline">simulator draft</Link> interaktif, analisis Win Rate dan Pick Rate di <Link to="/analytics" className="text-primary-400 hover:text-primary-300 underline">dashboard analytics</Link>, dan berkontribusi ke komunitas melalui <Link to="/contribute" className="text-primary-400 hover:text-primary-300 underline">sistem kontribusi terbuka</Link>. Bergabunglah bersama ribuan pemain yang menggunakan MLBB Hub untuk meningkatkan gameplay dan naik rank.
              </p>
            </div>
          </motion.section>

          {/* Features Grid */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-8 text-center">
              Apa yang Kami Tawarkan
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  icon: Users,
                  title: 'Berbasis Komunitas',
                  description: 'Dibangun oleh pemain, untuk pemain. Kirim kontribusi, vote tier list, dan bentuk meta bersama.',
                  color: 'from-blue-500 to-blue-700'
                },
                {
                  icon: TrendingUp,
                  title: 'Update Real-Time',
                  description: 'Selalu terdepan dengan patch notes terkini, tren meta, dan pembaruan tier list instan dari komunitas.',
                  color: 'from-green-500 to-emerald-700'
                },
                {
                  icon: Shield,
                  title: 'Data Lengkap',
                  description: '111+ hero, 1000+ skin, database item & arcana lengkap, semua dalam satu tempat.',
                  color: 'from-purple-500 to-indigo-700'
                },
                {
                  icon: Code,
                  title: 'Terbuka & Transparan',
                  description: 'Sistem kontribusi terbuka, API publik, dan pendekatan community-first dalam semua yang kami bangun.',
                  color: 'from-orange-500 to-rose-700'
                }
              ].map((feature, i) => (
                <motion.div
                  key={feature.title}
                  className="p-6 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] hover:bg-white/[0.06] transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                >
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* FAQ Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-8 text-center">
              Pertanyaan yang Sering Ditanyakan
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: 'Apa itu MLBB Hub?',
                  a: 'MLBB Hub adalah platform berbasis komunitas yang komprehensif untuk pemain Mobile Legends: Bang Bang, menyediakan panduan hero, tier list, counter pick, galeri skin, patch notes, dan banyak lagi. Semua fitur gratis dan diperbarui secara rutin.'
                },
                {
                  q: 'Seberapa sering tier list diperbarui?',
                  a: 'Tier list kami di-vote oleh komunitas dan diperbarui secara real-time saat pemain memberikan suara. Kami juga memantau perubahan meta setelah setiap patch dan hasil turnamen besar untuk memastikan akurasi.'
                },
                {
                  q: 'Bisakah saya berkontribusi ke MLBB Hub?',
                  a: 'Tentu! MLBB Hub berbasis komunitas. Kamu bisa mengirim skin baru, melaporkan counter, berkontribusi data hero, dan berpartisipasi dalam voting tier list. Kunjungi halaman Kontribusi untuk memulai.'
                },
                {
                  q: 'Apakah MLBB Hub terafiliasi dengan Moonton?',
                  a: 'Tidak. MLBB Hub adalah sumber daya komunitas fan-made yang independen dan tidak berafiliasi secara resmi dengan Moonton atau ByteDance.'
                },
                {
                  q: 'Bagaimana cara menemukan counter terbaik untuk hero?',
                  a: 'Kunjungi halaman Counter Pick, cari hero mana saja, dan kamu akan melihat data matchup lengkap termasuk counter kuat, synergy, dan hero yang mereka counter. Semua data bersumber dari kontribusi komunitas dan statistik resmi.'
                },
                {
                  q: 'Apakah MLBB Hub gratis?',
                  a: 'Ya, sepenuhnya gratis! Semua fitur di MLBB Hub tidak dipungut biaya. Kami percaya dalam menyediakan sumber daya berkualitas tinggi yang mudah diakses oleh semua pemain Mobile Legends: Bang Bang.'
                }
              ].map((faq, i) => (
                <motion.details
                  key={i}
                  className="group p-5 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] hover:bg-white/[0.06] transition-all duration-300"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <summary className="cursor-pointer text-base font-semibold text-white group-hover:text-primary-300 transition-colors flex items-center justify-between">
                    {faq.q}
                    <ArrowRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
                  </summary>
                  <p className="mt-3 text-sm text-gray-400 leading-relaxed">{faq.a}</p>
                </motion.details>
              ))}
            </div>
          </motion.section>

          {/* CTA */}
          <motion.section
            className="text-center pt-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-2xl font-display font-bold text-white mb-4">
              Siap naik level?
            </h3>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Mulai jelajahi fitur kami dan bergabung dengan komunitas sekarang
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/heroes"
                className="group flex items-center gap-3 px-8 py-4 bg-primary-500 text-white rounded-2xl text-lg font-semibold hover:bg-primary-600 transition-all duration-300"
              >
                <span>Jelajahi Hero</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/contribute"
                className="flex items-center gap-3 px-8 py-4 text-gray-300 hover:text-white transition-colors"
              >
                <span>Mulai Berkontribusi</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
