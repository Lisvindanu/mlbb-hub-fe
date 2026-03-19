import { Link } from '@tanstack/react-router';
import { AlertTriangle, CheckCircle, Heart, Home, List } from 'lucide-react';

export function IncidentPage() {
  return (
    <div style={{ background: '#0a0f1e', minHeight: '100vh' }} className="py-12 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Back to home */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm mb-10 transition-colors"
          style={{ color: '#94a3b8' }}
        >
          <Home className="w-4 h-4" />
          Kembali ke Halaman Utama
        </Link>

        {/* Header */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            <AlertTriangle className="w-8 h-8" style={{ color: '#ef4444' }} />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#ffffff' }}>
            Kami Minta Maaf
          </h1>
          <p style={{ color: '#94a3b8' }} className="text-base">
            Terjadi kesalahan pada tanggal <strong style={{ color: '#e2e8f0' }}>26 Februari 2026</strong> yang menyebabkan hilangnya data tier list komunitas.
          </p>
        </div>

        {/* Status */}
        <div
          className="flex items-center justify-center gap-2 mb-8 py-2 rounded-full text-sm"
          style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#22c55e' }}
        >
          <CheckCircle className="w-4 h-4" />
          Masalah telah diperbaiki dan tidak akan terulang lagi
        </div>

        {/* What happened - simple language */}
        <div
          className="rounded-2xl p-6 mb-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <h2 className="font-semibold text-lg mb-3 flex items-center gap-2" style={{ color: '#f1f5f9' }}>
            <span style={{ color: '#f59e0b' }}>⚠️</span> Apa yang Terjadi?
          </h2>
          <p style={{ color: '#cbd5e1' }} className="leading-relaxed">
            Saat melakukan pembaruan sistem, tim kami tidak sengaja menjalankan perintah yang me-reset server ke versi lama. Akibatnya, semua tier list yang sudah dibuat oleh komunitas sejak terakhir kali server di-update <strong style={{ color: '#f1f5f9' }}>terhapus secara permanen</strong> dan tidak bisa dikembalikan meski sudah kami coba berbagai cara.
          </p>
        </div>

        {/* Who was affected */}
        <div
          className="rounded-2xl p-6 mb-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2" style={{ color: '#f1f5f9' }}>
            <span>😔</span> Data yang Hilang
          </h2>
          <p style={{ color: '#cbd5e1' }} className="text-sm mb-4">
            Tier list milik pengguna berikut tidak berhasil kami selamatkan:
          </p>
          <div className="space-y-2 mb-4">
            {[
              { name: 'Aji', count: 6 },
              { name: 'Eionts', count: 1 },
              { name: 'WaNNaruu', count: 1 },
            ].map(({ name, count }) => (
              <div
                key={name}
                className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
              >
                <span className="font-semibold" style={{ color: '#f1f5f9' }}>{name}</span>
                <span className="text-sm" style={{ color: '#f87171' }}>
                  {count} tier list hilang
                </span>
              </div>
            ))}
          </div>
          <div
            className="rounded-xl p-4 flex gap-3 text-sm"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <Heart className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#f472b6' }} />
            <p style={{ color: '#94a3b8' }}>
              Kami sudah mencoba semua cara yang ada untuk memulihkan data ini, namun sayangnya data tersebut sudah tidak bisa dikembalikan. Kami sangat menyesal atas hal ini dan memohon maaf sebesar-besarnya kepada kalian yang terdampak.
            </p>
          </div>
        </div>

        {/* What we fixed - simple language */}
        <div
          className="rounded-2xl p-6 mb-8"
          style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)' }}
        >
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2" style={{ color: '#f1f5f9' }}>
            <span>🛡️</span> Yang Sudah Kami Perbaiki
          </h2>
          <div className="space-y-3">
            {[
              {
                title: 'Penyimpanan dipindah ke database',
                desc: 'Tier list sekarang disimpan di sistem database yang terpisah dari proses update, jadi tidak akan ikut terhapus saat ada pembaruan.',
              },
              {
                title: 'Proteksi data aktif',
                desc: 'Data komunitas sekarang sudah diproteksi sehingga operasi teknis apapun tidak akan bisa menyentuh atau menghapusnya.',
              },
              {
                title: 'Aman untuk seterusnya',
                desc: 'Semua tier list baru yang dibuat mulai sekarang akan tersimpan dengan aman dan tidak akan hilang lagi.',
              },
            ].map(({ title, desc }) => (
              <div key={title} className="flex gap-3">
                <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#22c55e' }} />
                <div>
                  <p className="font-medium text-sm" style={{ color: '#f1f5f9' }}>{title}</p>
                  <p className="text-sm mt-0.5" style={{ color: '#94a3b8' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/tier-list"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all text-sm"
            style={{ background: '#f59e0b', color: '#000' }}
          >
            <List className="w-4 h-4" />
            Buat Tier List Baru
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all text-sm"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <Home className="w-4 h-4" />
            Halaman Utama
          </Link>
        </div>

        <p className="text-center mt-8 text-xs" style={{ color: '#475569' }}>
          MLBB Hub Team — 26 Februari 2026
        </p>

      </div>
    </div>
  );
}
