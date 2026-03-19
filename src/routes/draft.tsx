import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

const DraftPage = lazy(() => import('../pages/DraftPage').then(m => ({ default: m.DraftPage })));

export const Route = createFileRoute('/draft')({
  component: () => (
    <Suspense fallback={<div className="min-h-screen bg-dark-400" />}>
      <DraftPage />
    </Suspense>
  ),
});
