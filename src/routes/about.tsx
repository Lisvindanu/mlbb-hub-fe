import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

const AboutPage = lazy(() => import('../pages/AboutPage').then(m => ({ default: m.AboutPage })));

export const Route = createFileRoute('/about')({
  component: () => (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" /></div>}>
      <AboutPage />
    </Suspense>
  ),
});
