import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

const HeroesPage = lazy(() => import('../../pages/HeroesPage').then(m => ({ default: m.HeroesPage })));

export const Route = createFileRoute('/heroes/')({
  component: () => (
    <Suspense fallback={<div className="min-h-screen bg-dark-400" />}>
      <HeroesPage />
    </Suspense>
  ),
});
