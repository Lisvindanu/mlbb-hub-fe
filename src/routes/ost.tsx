import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

const OSTPage = lazy(() => import('../pages/OSTPage').then(m => ({ default: m.OSTPage })));

export const Route = createFileRoute('/ost')({
  component: () => (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" /></div>}>
      <OSTPage />
    </Suspense>
  ),
});
