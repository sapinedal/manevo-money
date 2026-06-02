import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './core/store/auth.store';
import { WorkspaceLayout } from './presentation/layouts/WorkspaceLayout';
import { Dashboard } from './presentation/pages/Dashboard';
import './presentation/styles/index.css';
import { Accounts } from './presentation/pages/Accounts';
import { Categories } from './presentation/pages/Categories';
import { Transactions } from './presentation/pages/Transactions';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

import { useMe } from './infrastructure/hooks/useAuth';
import { useAccounts } from './infrastructure/hooks/useFinance';
import { Landing } from './presentation/pages/Landing';
import { OnboardingWizard } from './presentation/components/OnboardingWizard';
import { InviteAccept } from './presentation/pages/InviteAccept';

function AppRoutes() {
  const { isAuthenticated, activeWorkspaceId } = useAuthStore();
  const { isLoading: isLoadingSession } = useMe();
  const { data: accounts, isLoading: isLoadingAccounts } = useAccounts(activeWorkspaceId);
  const [isOnboarded, setIsOnboarded] = React.useState<boolean | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (accounts !== undefined && !isLoadingAccounts) {
      if (isOnboarded === null) {
        setIsOnboarded(accounts.length > 0);
      }
    }
  }, [accounts, isLoadingAccounts, isOnboarded]);

  React.useEffect(() => {
    if (!isAuthenticated) {
      setIsOnboarded(null);
    }
  }, [isAuthenticated]);

  // Handle routing redirects based on authentication and onboarding status
  React.useEffect(() => {
    if (isLoadingSession || (isAuthenticated && isLoadingAccounts && isOnboarded === null)) {
      return;
    }

    if (!isAuthenticated) {
      // If not logged in and visiting app pages, redirect to landing (/)
      if (location.pathname !== '/' && !location.pathname.startsWith('/invite/')) {
        navigate('/');
      }
    } else {
      // If logged in
      if (isOnboarded === false) {
        if (location.pathname !== '/onboarding' && !location.pathname.startsWith('/invite/')) {
          navigate('/onboarding');
        }
      } else if (isOnboarded === true) {
        if (location.pathname === '/' || location.pathname === '/onboarding') {
          const pendingToken = localStorage.getItem('pending_invite_token');
          if (pendingToken) {
            navigate(`/invite/${pendingToken}`);
          } else {
            navigate('/app/money/dashboard');
          }
        }
      }
    }
  }, [isAuthenticated, isOnboarded, isLoadingSession, isLoadingAccounts, location.pathname, navigate]);

  if (isLoadingSession || (isAuthenticated && isLoadingAccounts && isOnboarded === null)) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#030303] text-zinc-500 font-medium">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-accent-500/20 border-t-accent-500 animate-spin" />
          <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={!isAuthenticated ? <Landing /> : <Navigate to="/app/money/dashboard" replace />} />
      <Route path="/invite/:token" element={<InviteAccept />} />

      <Route path="/onboarding" element={
        isAuthenticated && isOnboarded === false ? (
          <OnboardingWizard onComplete={() => setIsOnboarded(true)} />
        ) : (
          <Navigate to="/" replace />
        )
      } />

      <Route path="/app/money/*" element={
        isAuthenticated && isOnboarded === true ? (
          <WorkspaceLayout>
            <Routes>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="categories" element={<Categories />} />
              <Route path="accounts" element={<Accounts />} />
              <Route path="intentions" element={
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-extrabold text-white tracking-tight">Intenciones y Presupuestos</h2>
                    <p className="text-xs text-zinc-500 mt-1">Metas de ahorro, límites mensuales e intenciones financieras.</p>
                  </div>
                  <div className="space-y-4">
                    {[
                      { name: 'Fondo de Emergencias', current: 1500, target: 5000, color: '#00f2a1' },
                      { name: 'Vacaciones', current: 800, target: 2000, color: '#3b82f6' },
                      { name: 'Inversiones', current: 2000, target: 10000, color: '#a855f7' }
                    ].map((item, idx) => (
                      <div key={idx} className="bg-[#070707]/60 border border-white/[0.04] p-5 rounded-[22px] space-y-3">
                        <div className="flex justify-between items-center text-sm font-semibold">
                          <span className="text-zinc-200">{item.name}</span>
                          <span className="text-white">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.current)} / {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.target)}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-zinc-950 border border-white/[0.02] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              backgroundColor: item.color,
                              width: `${(item.current / item.target) * 100}%`
                            }}
                          />
                        </div>
                        <div className="text-[10px] text-zinc-500 font-bold">
                          {Math.round((item.current / item.target) * 100)}% COMPLETADO
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              } />
              <Route path="settings" element={
                <div className="text-sm text-zinc-500 p-8 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/20">
                  Configuración y Permisos del Workspace en desarrollo.
                </div>
              } />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </WorkspaceLayout>
        ) : (
          <Navigate to="/" replace />
        )
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
