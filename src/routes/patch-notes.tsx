import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

const PatchNotesPage = lazy(() => import('../pages/PatchNotesPage').then(m => ({ default: m.PatchNotesPage })));

export const Route = createFileRoute('/patch-notes')({
  component: () => (
    <Suspense fallback={<div className="min-h-screen bg-dark-400" />}>
      <PatchNotesPage />
    </Suspense>
  ),
});
