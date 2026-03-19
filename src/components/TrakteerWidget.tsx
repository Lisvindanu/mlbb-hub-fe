import { useState } from 'react';
import { X } from 'lucide-react';

export function TrakteerWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating support button */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex fixed bottom-6 right-6 z-40 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        style={{ backgroundColor: '#be1e2d' }}
        aria-label="Dukung Saya di Trakteer"
      >
        <img
          src="https://edge-cdn.trakteer.id/images/embed/trbtn-icon.png?v=14-05-2025"
          alt="Trakteer"
          className="h-5 w-5 object-contain"
          style={{ aspectRatio: '1/1' }}
        />
        <span>Dukung Saya</span>
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="relative flex flex-col rounded-2xl overflow-hidden shadow-2xl"
            style={{ width: 'min(480px, calc(100vw - 2rem))', height: 'min(600px, calc(100vh - 4rem))' }}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
              aria-label="Tutup"
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
