import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

const AnalyticsPage = lazy(() => import('../pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));

export const Route = createFileRoute('/analytics')({
  component: () => (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" /></div>}>
      <AnalyticsPage />
    </Suspense>
  ),
});
