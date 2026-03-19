import { createRootRoute, Outlet, useLocation } from '@tanstack/react-router';
import { Layout } from '../components/layout/Layout';
import { useEffect } from 'react';

function RootComponent() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
});
