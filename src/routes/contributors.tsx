import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

const ContributorsPage = lazy(() => import('../pages/ContributorsPage').then(m => ({ default: m.ContributorsPage })));

export const Route = createFileRoute('/contributors')({
  component: () => (
    <Suspense fallback={<div className="min-h-screen bg-dark-400" />}>
      <ContributorsPage />
    </Suspense>
  ),
});
