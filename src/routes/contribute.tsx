import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

const ContributePage = lazy(() => import('../pages/ContributePage').then(m => ({ default: m.ContributePage })));

export const Route = createFileRoute('/contribute')({
  component: () => (
    <Suspense fallback={<div className="min-h-screen bg-dark-400" />}>
      <ContributePage />
    </Suspense>
  ),
});
