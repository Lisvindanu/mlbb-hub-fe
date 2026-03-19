import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

const SkinsPage = lazy(() => import('../pages/SkinsPage').then(m => ({ default: m.SkinsPage })));

export const Route = createFileRoute('/skins')({
  component: () => (
    <Suspense fallback={<div className="min-h-screen bg-dark-400" />}>
      <SkinsPage />
    </Suspense>
  ),
});
