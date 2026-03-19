import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

const AdminDashboard = lazy(() => import('../pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

export const Route = createFileRoute('/admin')({
  component: () => (
    <Suspense fallback={<div className="min-h-screen bg-dark-400" />}>
      <AdminDashboard />
    </Suspense>
  ),
});
