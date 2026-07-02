import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from './components/Sidebar';
import { DashboardView }  from './views/DashboardView';
import { WebhooksView }   from './views/WebhooksView';
import { RulesView }      from './views/RulesView';
import { ExecutionsView } from './views/ExecutionsView';
import { ReplaysView }    from './views/ReplaysView';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1, staleTime: 5000 },
  },
});

const PAGE_TITLES: Record<string, string> = {
  '/':            'Dashboard',
  '/webhooks':   'Webhooks',
  '/rules':      'Rules',
  '/executions': 'Executions',
  '/replays':    'Replays',
};

const MainLayout: React.FC<{
  tenantId: string;
  onTenantChange: (id: string) => void;
}> = ({ tenantId, onTenantChange }) => {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] ?? 'Autoshield';

  return (
    <div className="ae-layout">
      <Sidebar tenantId={tenantId} onTenantChange={onTenantChange} />

      <div className="ae-main">
        {/* ── Topbar ─────────────────────────────────────────── */}
        <div className="ae-topbar">
          {/* Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="live-indicator">
              <div className="live-dot" />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)' }}>LIVE</span>
            </div>
            <div style={{ width: 1, height: 14, background: 'var(--border-default)' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{title}</span>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500 }}>Tenant</span>
            <span
              className="mono"
              style={{
                fontSize: 11,
                color: 'var(--text-secondary)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 6,
                padding: '3px 9px',
              }}
            >
              {tenantId}
            </span>
          </div>
        </div>

        {/* ── Page content ───────────────────────────────────── */}
        <div
          key={location.pathname}
          className="ae-content anim-fade-up"
        >
          <Routes>
            <Route path="/"            element={<DashboardView />} />
            <Route path="/webhooks"   element={<WebhooksView />} />
            <Route path="/rules"      element={<RulesView />} />
            <Route path="/executions" element={<ExecutionsView />} />
            <Route path="/replays"    element={<ReplaysView />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const [tenantId, setTenantId] = useState<string>(() =>
    localStorage.getItem('tenantId') || '60d5ec4a2f8fb814c8f8d9f1'
  );

  const handleChange = (id: string) => {
    localStorage.setItem('tenantId', id);
    setTenantId(id);
    queryClient.resetQueries();
  };

  useEffect(() => {
    if (!localStorage.getItem('tenantId')) {
      localStorage.setItem('tenantId', tenantId);
    }
  }, [tenantId]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <MainLayout tenantId={tenantId} onTenantChange={handleChange} />
      </Router>
    </QueryClientProvider>
  );
};

export default App;
