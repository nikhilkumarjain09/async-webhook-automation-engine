import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Webhook, Sliders, PlayCircle,
  RotateCcw, KeyRound, Shield, ChevronRight, Circle,
} from 'lucide-react';

const NAV = [
  { to: '/',            label: 'Dashboard',   icon: LayoutDashboard, end: true },
  { to: '/webhooks',   label: 'Webhooks',    icon: Webhook },
  { to: '/rules',      label: 'Rules',       icon: Sliders },
  { to: '/executions', label: 'Executions',  icon: PlayCircle },
  { to: '/replays',    label: 'Replays',     icon: RotateCcw },
];

export const Sidebar: React.FC<{
  tenantId: string;
  onTenantChange: (id: string) => void;
}> = ({ tenantId, onTenantChange }) => {
  const [draft, setDraft] = useState(tenantId);
  useEffect(() => setDraft(tenantId), [tenantId]);

  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    const t = draft.trim();
    if (/^[0-9a-fA-F]{24}$/.test(t)) {
      onTenantChange(t);
    } else {
      alert('Tenant ID must be a valid 24-character hex string (MongoDB ObjectId).');
    }
  };

  return (
    <nav className="ae-sidebar">
      {/* ── Brand ─────────────────────────────────────────────── */}
      <div className="ae-brand">
        <div className="ae-brand-icon">
          <Shield size={15} color="#fff" />
        </div>
        <div>
          <div className="ae-brand-name">Autoshield</div>
          <div className="ae-brand-version">Automation Engine</div>
        </div>
      </div>

      {/* ── Navigation ────────────────────────────────────────── */}
      <div className="ae-nav">
        <div className="ae-nav-label">Navigation</div>
        <div className="ae-nav-group">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `ae-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon className="ae-nav-icon" size={15} />
              {label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* ── Tenant context ────────────────────────────────────── */}
      <div className="ae-sidebar-footer">
        <div className="ae-tenant-box">
          <div className="ae-tenant-label">
            <KeyRound size={10} />
            Tenant Context
          </div>
          <form onSubmit={apply} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              type="text"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="24-char ObjectId…"
              className="form-input"
              style={{
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
                padding: '6px 10px',
                background: 'var(--bg-canvas)',
              }}
            />
            <button
              type="submit"
              className="btn btn-ghost btn-sm"
              disabled={draft.trim() === tenantId}
              style={{ width: '100%', justifyContent: 'center', fontSize: 11, padding: '5px 0' }}
            >
              Apply <ChevronRight size={11} />
            </button>
          </form>
        </div>

        {/* Status indicator */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7, marginTop: 10,
          padding: '8px 12px', borderRadius: 8,
          background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
        }}>
          <Circle size={7} style={{ color: '#22c55e', fill: '#22c55e', animation: 'pulse-dot 2s ease-in-out infinite' }} />
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500 }}>Connected</span>
          <span className="mono" style={{ fontSize: 10, color: 'var(--text-disabled)', marginLeft: 'auto', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {tenantId.slice(0, 8)}…
          </span>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
