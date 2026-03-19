import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

const TierListPage = lazy(() => import('../pages/TierListPage').then(m => ({ default: m.TierListPage })));

export const Route = createFileRoute('/tier-list')({
  component: () => (
    <Suspense fallback={<div className="min-h-screen bg-dark-400" />}>
      <TierListPage />
    </Suspense>
  ),
});
