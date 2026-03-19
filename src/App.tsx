import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { FeedbackModal } from './components/layout/FeedbackModal';

function MascotGreeting() {
  const [visible, setVisible] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <>
      {/* Mobile: always show small button */}
      {/* Desktop: show small button only when minimized */}
      <button
        onClick={() => { setMinimized(false); setShowFeedback(true); }}
        className={`fixed bottom-20 left-4 z-[9999] w-12 h-12 rounded-full bg-primary-500 hover:bg-primary-400 shadow-lg flex items-center justify-center transition-all hover:scale-110 md:hidden`}
        title="Kritik & Saran"
        style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}
      >
        <span className="text-xl">💬</span>
      </button>

      {minimized && (
        <button
          onClick={() => setMinimized(false)}
          className="hidden md:flex fixed bottom-6 left-4 z-[9999] w-12 h-12 rounded-full bg-primary-500 hover:bg-primary-400 shadow-lg items-center justify-center transition-all hover:scale-110"
          title="Buka Arli"
          style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}
        >
          <span className="text-xl">💬</span>
        </button>
      )}

      {/* Desktop full mascot */}
      {!minimized && (
        <div
          className="hidden md:flex fixed bottom-0 left-4 z-[9999] flex-col items-center"
          style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.6))' }}
        >
          <button
            onClick={() => setShowFeedback(true)}
            className="mb-1 ml-16 bg-white text-dark-400 text-xs font-bold px-3 py-2 rounded-xl rounded-bl-none shadow-lg whitespace-nowrap hover:bg-yellow-50 transition-colors"
          >
            Punya saran? Klik aku! 💬
          </button>

          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setMinimized(true); }}
              className="absolute -top-2 -right-2 w-7 h-7 bg-dark-300 border border-white/20 rounded-full text-gray-400 hover:text-white flex items-center justify-center z-10 shadow"
              title="Sembunyikan"
            >
              <X className="w-3 h-3" />
            </button>
            <div onClick={() => setShowFeedback(true)} className="cursor-pointer">
              <video
                ref={videoRef}
                src="/assets/arli-hai-nobg.webm"
                autoPlay
                muted
                playsInline
                loop
                className="w-40 md:w-52"
              />
            </div>
          </div>
        </div>
      )}

      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
    </>
  );
}


// Create a new query client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <MascotGreeting />
    </QueryClientProvider>
  );
}

export default App;
