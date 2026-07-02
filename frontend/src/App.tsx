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
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});

// Inner layout reads location to key the page fade
const AppLayout: React.FC<{ tenantId: string; onTenantChange: (id: string) => void }> = ({
  tenantId,
  onTenantChange,
}) => {
  const location = useLocation();

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar tenantId={tenantId} onTenantChange={onTenantChange} />

      {/* Main viewport */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* Topbar */}
        <div style={{
          height: 52,
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-surface)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px',
          flexShrink: 0,
        }}>
          {/* Left: live indicator */}
          <div className="flex items-center gap-2">
            <div className="live-dot" />
            <span className="label">Live Telemetry</span>
          </div>

          {/* Right: current tenant badge */}
          <div className="flex items-center gap-2">
            <span className="label">Tenant</span>
            <span className="mono text-slate-300 rounded-lg px-2 py-1"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontSize: '0.6875rem' }}>
              {tenantId}
            </span>
          </div>
        </div>

        {/* Scrollable page area */}
        <div key={location.pathname} className="anim-fade-up" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
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

  const handleTenantChange = (id: string) => {
    localStorage.setItem('tenantId', id);
    setTenantId(id);
    queryClient.resetQueries();
  };

  useEffect(() => {
    if (!localStorage.getItem('tenantId')) localStorage.setItem('tenantId', tenantId);
  }, [tenantId]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppLayout tenantId={tenantId} onTenantChange={handleTenantChange} />
      </Router>
    </QueryClientProvider>
  );
};

export default App;
