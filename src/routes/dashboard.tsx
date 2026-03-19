import { createFileRoute, redirect } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

const DashboardPage = lazy(() => import('../pages/DashboardPage').then(m => ({ default: m.DashboardPage })));

export const Route = createFileRoute('/dashboard')({
  beforeLoad: () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw redirect({
        to: '/auth',
      });
    }
  },
  component: () => (
    <Suspense fallback={<div className="min-h-screen bg-dark-400" />}>
      <DashboardPage />
    </Suspense>
  ),
});
