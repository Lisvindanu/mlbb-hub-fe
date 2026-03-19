import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

const AuthPage = lazy(() => import('../pages/AuthPage').then(m => ({ default: m.AuthPage })));

export const Route = createFileRoute('/auth')({
  component: () => (
    <Suspense fallback={<div className="min-h-screen bg-dark-400" />}>
      <AuthPage />
    </Suspense>
  ),
});
