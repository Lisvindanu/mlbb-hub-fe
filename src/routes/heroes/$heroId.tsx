import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

const HeroDetailPage = lazy(() => import('../../pages/HeroDetailPage').then(m => ({ default: m.HeroDetailPage })));

export const Route = createFileRoute('/heroes/$heroId')({
  component: () => (
    <Suspense fallback={<div className="min-h-screen bg-dark-400" />}>
      <HeroDetailPage />
    </Suspense>
  ),
});
