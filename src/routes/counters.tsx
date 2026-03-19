import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

const CounterPage = lazy(() => import('../pages/CounterPage').then(m => ({ default: m.CounterPage })));

export const Route = createFileRoute('/counters')({
  component: () => (
    <Suspense fallback={<div className="min-h-screen bg-dark-400" />}>
      <CounterPage />
    </Suspense>
  ),
});
