import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

const ItemSynergyPage = lazy(() => import('../pages/ItemSynergyPage').then(m => ({ default: m.ItemSynergyPage })));

export const Route = createFileRoute('/item-synergy')({
  component: () => (
    <Suspense fallback={<div className="min-h-screen bg-dark-400" />}>
      <ItemSynergyPage />
    </Suspense>
  ),
});
