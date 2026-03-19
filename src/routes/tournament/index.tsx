import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

const TournamentPage = lazy(() => import('../../pages/TournamentPage').then(m => ({ default: m.TournamentPage })));

export const Route = createFileRoute('/tournament/')({
  component: () => (
    <Suspense fallback={<div className="min-h-screen bg-dark-400" />}>
      <TournamentPage />
    </Suspense>
  ),
});
