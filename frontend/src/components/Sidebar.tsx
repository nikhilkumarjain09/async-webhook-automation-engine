import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Webhook, Sliders, PlayCircle,
  RotateCcw, KeyRound, Shield, ChevronRight,
} from 'lucide-react';
import { Btn } from './UI';

const NAV_ITEMS = [
  { to: '/',           label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/webhooks',  label: 'Webhooks',     icon: Webhook },
  { to: '/rules',     label: 'Rules',        icon: Sliders },
  { to: '/executions',label: 'Executions',   icon: PlayCircle },
  { to: '/replays',   label: 'Replays',      icon: RotateCcw },
];

interface SidebarProps {
  tenantId: string;
  onTenantChange: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ tenantId, onTenantChange }) => {
  const [draft, setDraft] = useState(tenantId);

  useEffect(() => { setDraft(tenantId); }, [tenantId]);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (/^[0-9a-fA-F]{24}$/.test(draft.trim())) {
      onTenantChange(draft.trim());
    } else {
      alert('Tenant ID must be a valid 24-character hex string');
    }
  };

  return (
    <nav className="sidebar">
      {/* Wordmark */}
      <div className="flex items-center gap-2.5 px-4 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #5865f2, #7c3aed)', boxShadow: '0 0 0 1px rgba(255,255,255,0.08)' }}>
          <Shield size={14} className="text-white" />
        </div>
        <div>
          <p className="text-[13px] font-bold text-white tracking-tight leading-none">Autoshield</p>
          <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Automation Engine</p>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-3 px-2">
        <div className="space-y-0.5">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={15} className="nav-icon flex-shrink-0" style={{ opacity: 0.7 }} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      {/* Tenant Context Panel */}
      <div className="p-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="rounded-xl p-3 space-y-2.5" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-1.5">
            <KeyRound size={12} className="text-slate-500" />
            <p className="label">Tenant Context</p>
          </div>
          <form onSubmit={handleApply} className="flex flex-col gap-2">
            <input
              type="text"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="24-char hex Tenant ID"
              className="input-base"
              style={{ fontSize: '0.6875rem', fontFamily: "'JetBrains Mono', monospace", padding: '6px 10px' }}
            />
            <Btn
              type="submit"
              variant="ghost"
              disabled={draft === tenantId}
              style={{ width: '100%', fontSize: '0.6875rem', padding: '5px 10px', justifyContent: 'center' }}
            >
              Apply <ChevronRight size={11} />
            </Btn>
          </form>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
