import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

const TournamentDetailPage = lazy(() => import('../../pages/TournamentDetailPage').then(m => ({ default: m.TournamentDetailPage })));

export const Route = createFileRoute('/tournament/$id' as string)({
  component: () => (
    <Suspense fallback={<div className="min-h-screen bg-dark-400" />}>
      <TournamentDetailPage />
    </Suspense>
  ),
});
