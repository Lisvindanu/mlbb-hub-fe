import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

const ArcanaPage = lazy(() => import('../pages/ArcanaPage').then(m => ({ default: m.ArcanaPage })));

export const Route = createFileRoute('/arcana')({
  component: () => (
    <Suspense fallback={<div className="min-h-screen bg-dark-400" />}>
      <ArcanaPage />
    </Suspense>
  ),
});
