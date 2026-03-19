import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

const RoadmapPage = lazy(() => import('../pages/RoadmapPage').then(m => ({ default: m.RoadmapPage })));

export const Route = createFileRoute('/roadmap')({
  component: () => (
    <Suspense fallback={<div className="min-h-screen bg-dark-400" />}>
      <RoadmapPage />
    </Suspense>
  ),
});
