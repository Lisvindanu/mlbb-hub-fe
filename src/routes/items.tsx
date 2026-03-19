import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

const ItemsPage = lazy(() => import('../pages/ItemsPage').then(m => ({ default: m.ItemsPage })));

export const Route = createFileRoute('/items')({
  component: () => (
    <Suspense fallback={<div className="min-h-screen bg-dark-400" />}>
      <ItemsPage />
    </Suspense>
  ),
});
