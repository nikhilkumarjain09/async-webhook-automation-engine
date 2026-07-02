import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircle2, XCircle, Clock, Zap, RotateCcw,
  Copy, Check, ChevronDown, ChevronUp, Loader2,
  Inbox, AlertTriangle, ArrowRight, RefreshCw,
} from 'lucide-react';

// ── Helpers ─────────────────────────────────────────────────────────────────
const fmtDate = (s: string) =>
  new Date(s).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  });

const fmtMs = (ms: number) =>
  ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`;

// ── STATUS BADGE ────────────────────────────────────────────────────────────
export type StatusType = string;

const STATUS_ICONS: Record<string, React.ReactNode> = {
  completed:  <CheckCircle2 size={11} />,
  success:    <CheckCircle2 size={11} />,
  active:     <CheckCircle2 size={11} />,
  failed:     <XCircle      size={11} />,
  error:      <XCircle      size={11} />,
  retrying:   <RotateCcw    size={11} />,
  processing: <Zap          size={11} />,
  queued:     <Clock        size={11} />,
  pending:    <Clock        size={11} />,
  triggered:  <Clock        size={11} />,
  inactive:   <Clock        size={11} />,
};

export const StatusBadge: React.FC<{ status: StatusType; pulse?: boolean }> = ({ status, pulse = false }) => {
  const s = (status || 'unknown').toLowerCase();
  return (
    <span className={`badge badge-${s}`}>
      <span className={`badge-dot ${pulse && (s === 'active' || s === 'processing') ? 'dot-pulse' : ''}`} />
      {STATUS_ICONS[s] ?? <Clock size={11} />}
      {status}
    </span>
  );
};

// ── SOURCE CHIP ─────────────────────────────────────────────────────────────
export const SourceChip: React.FC<{ source: string }> = ({ source }) => {
  const key = source.toLowerCase();
  const cls = ['stripe','github','shopify','slack'].includes(key)
    ? `source-chip source-${key}`
    : 'source-chip source-default';
  return <span className={cls}>{source}</span>;
};

// ── METRIC CARD ─────────────────────────────────────────────────────────────
type Accent = 'indigo' | 'green' | 'red' | 'amber' | 'blue' | 'purple';

const ACCENT_TEXT: Record<Accent, string> = {
  indigo: '#a5b4fc', green: '#4ade80', red: '#f87171',
  amber: '#fbbf24',  blue: '#60a5fa',  purple: '#c084fc',
};
const ACCENT_ICON: Record<Accent, string> = {
  indigo: 'rgba(99,102,241,0.12)', green: 'rgba(34,197,94,0.1)',
  red:    'rgba(239,68,68,0.1)',   amber: 'rgba(245,158,11,0.1)',
  blue:   'rgba(59,130,246,0.1)', purple: 'rgba(168,85,247,0.1)',
};
const ACCENT_ICON_BORDER: Record<Accent, string> = {
  indigo: 'rgba(99,102,241,0.25)', green: 'rgba(34,197,94,0.2)',
  red:    'rgba(239,68,68,0.2)',   amber: 'rgba(245,158,11,0.2)',
  blue:   'rgba(59,130,246,0.2)', purple: 'rgba(168,85,247,0.2)',
};

interface MetricCardProps {
  title: string;
  value: string | number;
  sub?: string;
  trend?: { value: string; up: boolean };
  icon: React.ComponentType<{ size?: number }>;
  accent?: Accent;
}
export const MetricCard: React.FC<MetricCardProps> = ({
  title, value, sub, trend, icon: Icon, accent = 'indigo'
}) => (
  <div className={`metric-card mc-${accent}`}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="t-label" style={{ marginBottom: 12 }}>{title}</p>
        <p style={{
          fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.04em',
          lineHeight: 1, color: ACCENT_TEXT[accent], marginBottom: 8,
        }}>{value}</p>
        {sub && <p className="t-micro">{sub}</p>}
        {trend && (
          <p style={{ fontSize: 11, fontWeight: 600, marginTop: 8, color: trend.up ? '#4ade80' : '#f87171' }}>
            {trend.up ? '↑' : '↓'} {trend.value}
          </p>
        )}
      </div>
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        background: ACCENT_ICON[accent], border: `1px solid ${ACCENT_ICON_BORDER[accent]}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: ACCENT_TEXT[accent],
      }}>
        <Icon size={18} />
      </div>
    </div>
  </div>
);

// ── SECTION CARD ────────────────────────────────────────────────────────────
interface SectionCardProps {
  title?: string;
  subtitle?: string;
  icon?: React.ComponentType<{ size?: number }>;
  action?: React.ReactNode;
  children: React.ReactNode;
  noPad?: boolean;
  style?: React.CSSProperties;
  className?: string;
  footer?: React.ReactNode;
}
export const SectionCard: React.FC<SectionCardProps> = ({
  title, subtitle, icon: Icon, action, children, noPad = false, style, className = '', footer,
}) => (
  <div className={`card-section ${className}`} style={style}>
    {title && (
      <div className="section-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {Icon && <div style={{ color: 'var(--text-tertiary)', display: 'flex' }}><Icon size={14} /></div>}
          <div>
            <p className="section-head-title">{title}</p>
            {subtitle && <p className="section-head-sub">{subtitle}</p>}
          </div>
        </div>
        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </div>
    )}
    <div style={noPad ? {} : { padding: '0' }}>
      {children}
    </div>
    {footer && (
      <div style={{ borderTop: '1px solid var(--border-default)' }}>
        {footer}
      </div>
    )}
  </div>
);

// ── PAGE HEADER ─────────────────────────────────────────────────────────────
export const PageHeader: React.FC<{
  title: string;
  description?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
}> = ({ title, description, badge, action }) => (
  <div className="page-header">
    <div className="page-header-left">
      <div className="page-title-row">
        <h1 className="t-h1">{title}</h1>
        {badge}
      </div>
      {description && <p className="page-desc">{description}</p>}
    </div>
    {action && <div className="page-actions">{action}</div>}
  </div>
);

// ── EMPTY STATE ──────────────────────────────────────────────────────────────
export const EmptyState: React.FC<{
  icon?: React.ComponentType<{ size?: number }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ icon: Icon = Inbox, title, description, action }) => (
  <div className="empty-state anim-fade-up">
    <div className="empty-icon-wrap">
      <Icon size={24} />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 320 }}>
      <p className="t-h4">{title}</p>
      <p className="t-body" style={{ fontSize: 13, lineHeight: 1.6 }}>{description}</p>
    </div>
    {action && <div style={{ marginTop: 4 }}>{action}</div>}
  </div>
);

// ── ERROR ALERT ─────────────────────────────────────────────────────────────
export const ErrorAlert: React.FC<{
  title?: string;
  message: string;
  action?: React.ReactNode;
}> = ({ title = 'Error', message, action }) => (
  <div className="alert alert-error anim-fade-up">
    <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
    <div style={{ flex: 1 }}>
      <p style={{ fontWeight: 700, marginBottom: 2, color: 'var(--red-400)' }}>{title}</p>
      <p style={{ fontSize: 12, color: 'var(--red-400)', opacity: 0.85 }}>{message}</p>
      {action && <div style={{ marginTop: 10 }}>{action}</div>}
    </div>
  </div>
);

// ── SKELETON ROW ────────────────────────────────────────────────────────────
export const SkeletonRow: React.FC<{ cols?: number }> = ({ cols = 5 }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} style={{ padding: '14px 16px' }}>
        <div className={`skeleton`} style={{ height: 14, width: i === 0 ? 100 : i === cols - 1 ? 60 : '80%' }} />
      </td>
    ))}
  </tr>
);

export const SkeletonMetric: React.FC = () => (
  <div className="metric-card mc-indigo" style={{ gap: 0 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
      <div className="skeleton" style={{ height: 10, width: 80 }} />
      <div className="skeleton" style={{ height: 36, width: 36, borderRadius: 10 }} />
    </div>
    <div className="skeleton" style={{ height: 36, width: 70, marginBottom: 10 }} />
    <div className="skeleton" style={{ height: 10, width: 110 }} />
  </div>
);

export const SkeletonCard: React.FC = () => (
  <div className="card" style={{ padding: 24 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
      <div className="skeleton" style={{ height: 14, width: 120 }} />
      <div className="skeleton" style={{ height: 22, width: 60, borderRadius: 99 }} />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="skeleton" style={{ height: 12, width: '100%' }} />
      <div className="skeleton" style={{ height: 12, width: '80%' }} />
      <div className="skeleton" style={{ height: 12, width: '65%' }} />
    </div>
  </div>
);

// ── JSON VIEWER ──────────────────────────────────────────────────────────────
const syntaxHighlight = (data: any): string => {
  const json = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?|[{}[\],])/g,
    (match) => {
      let cls = 'json-number';
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? 'json-key' : 'json-string';
      } else if (/true|false/.test(match)) {
        cls = 'json-bool';
      } else if (/null/.test(match)) {
        cls = 'json-null';
      } else if (/[{}[\],]/.test(match)) {
        cls = 'json-bracket';
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
};

export const JsonViewer: React.FC<{ data: any; label?: string; maxHeight?: number }> = ({
  data, label, maxHeight = 320
}) => {
  const [copied, setCopied] = useState(false);
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  const html = syntaxHighlight(data);

  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ position: 'relative' }}>
      {label && <p className="t-label" style={{ marginBottom: 8 }}>{label}</p>}
      <div className="json-viewer" style={{ maxHeight }}>
        <pre
          style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
      <button
        onClick={copy}
        className="btn btn-icon btn-sm"
        style={{
          position: 'absolute', top: label ? 30 : 8, right: 8,
          width: 26, height: 26, border: 'none',
          background: 'var(--bg-elevated)', opacity: 0.9,
        }}
        title="Copy JSON"
      >
        {copied ? <Check size={11} style={{ color: '#4ade80' }} /> : <Copy size={11} />}
      </button>
    </div>
  );
};

// ── BUTTON ──────────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  loading?: boolean;
  icon?: React.ComponentType<{ size?: number }>;
  size?: 'sm' | 'md' | 'lg';
}
export const Btn: React.FC<BtnProps> = ({
  variant = 'primary', loading = false, icon: Icon, size = 'md',
  children, disabled, className = '', ...rest
}) => {
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';
  return (
    <button
      className={`btn btn-${variant} ${sizeClass} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Loader2 size={13} className="spin" /> : Icon ? <Icon size={13} /> : null}
      {children}
    </button>
  );
};

// ── FORM PRIMITIVES ─────────────────────────────────────────────────────────
export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string }> = ({
  label, hint, className = '', style, ...props
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
    {label && <label className="form-label">{label}</label>}
    <input className={`form-input ${className}`} style={style} {...props} />
    {hint && <p className="form-hint">{hint}</p>}
  </div>
);

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; hint?: string }> = ({
  label, hint, className = '', ...props
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
    {label && <label className="form-label">{label}</label>}
    <textarea className={`form-textarea ${className}`} {...props} />
    {hint && <p className="form-hint">{hint}</p>}
  </div>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options: { label: string; value: string }[];
  hint?: string;
}> = ({ label, options, hint, className = '', style, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
    {label && <label className="form-label">{label}</label>}
    <select className={`form-select ${className}`} style={style} {...props}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {hint && <p className="form-hint">{hint}</p>}
  </div>
);

// ── FILTER BAR ───────────────────────────────────────────────────────────────
export const FilterBar: React.FC<{ children: React.ReactNode; onReset?: () => void }> = ({
  children, onReset,
}) => (
  <div className="filter-bar">
    {children}
    {onReset && (
      <Btn variant="ghost" size="sm" onClick={onReset} style={{ alignSelf: 'flex-end', minWidth: 60 }}>
        <RefreshCw size={12} /> Reset
      </Btn>
    )}
  </div>
);

// ── PAGINATION BAR ──────────────────────────────────────────────────────────
export const Pagination: React.FC<{
  page: number; hasNext: boolean;
  onPrev: () => void; onNext: () => void;
  total?: number; limit?: number;
}> = ({ page, hasNext, onPrev, onNext, total, limit }) => {
  const showing = total !== undefined && limit !== undefined
    ? `${(page - 1) * limit + 1}–${Math.min(page * limit, total)} of ${total}`
    : `Page ${page}`;

  return (
    <div className="pagination">
      <span className="pagination-info">{showing}</span>
      <div className="pagination-controls">
        <button className="page-btn" onClick={onPrev} disabled={page <= 1}>
          <ChevronDown size={13} style={{ transform: 'rotate(90deg)' }} />
        </button>
        <button className="page-btn current">{page}</button>
        <button className="page-btn" onClick={onNext} disabled={!hasNext}>
          <ChevronDown size={13} style={{ transform: 'rotate(-90deg)' }} />
        </button>
      </div>
    </div>
  );
};

// ── MODAL ────────────────────────────────────────────────────────────────────
export const Modal: React.FC<{
  open: boolean; onClose: () => void;
  title: string; subtitle?: string;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}> = ({ open, onClose, title, subtitle, footer, size = 'md', children }) => {
  const maxW = { sm: 420, md: 560, lg: 720, xl: 900 }[size];

  // Lock body scroll while modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  // Render via portal so it escapes any parent transform / overflow / stacking context
  return createPortal(
    <div
      className="modal-backdrop"
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
    >
      <div className="modal-panel" style={{ maxWidth: maxW, position: 'relative' }}>
        <div className="modal-header" style={{ paddingBottom: 16 }}>
          <p className="modal-title">{title}</p>
          {subtitle && <p className="modal-subtitle">{subtitle}</p>}
          <button className="btn btn-icon btn-sm modal-close" onClick={onClose}>
            <XCircle size={14} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
};


// ── WORKFLOW CARD ───────────────────────────────────────────────────────────
interface WFStep { type: 'trigger' | 'condition' | 'action'; label: string; sub?: string; }
export const WorkflowCard: React.FC<{
  name: string; description?: string; status: string;
  steps: WFStep[]; onView?: () => void;
}> = ({ name, description, status, steps, onView }) => (
  <div className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 18, height: '100%' }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="t-h4" style={{ marginBottom: 4, lineHeight: 1.4 }}>{name}</p>
        {description && <p className="t-small" style={{ lineHeight: 1.6 }}>{description}</p>}
      </div>
      <StatusBadge status={status} />
    </div>

    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const tagCls = `wf-tag wf-tag-${step.type}`;
        return (
          <div key={i}>
            <div className="wf-step">
              <span className={tagCls}>{step.type}</span>
              <span className="t-h4" style={{ fontWeight: 600, fontSize: 12 }}>{step.label}</span>
              {step.sub && (
                <span className="mono t-micro" style={{ marginLeft: 'auto', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {step.sub}
                </span>
              )}
            </div>
            {!isLast && <div className="wf-connector" />}
          </div>
        );
      })}
    </div>

    {onView && (
      <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
        <Btn variant="ghost" size="sm" onClick={onView} icon={ArrowRight}>View Config</Btn>
      </div>
    )}
  </div>
);

// ── EXECUTION CARD (expandable) ─────────────────────────────────────────────
export interface ExecStep {
  actionIndex: number;
  actionType: string;
  status: string;
  durationMs: number;
  error?: string;
  requestPayload?: any;
  responsePayload?: any;
  executedAt: string;
}
export const ExecutionCard: React.FC<{
  id: string;
  rule: { _id: string; name: string; triggerSource?: string; triggerEventType?: string; description?: string } | string;
  webhook: { _id: string; source?: string; eventType?: string; eventIdentifier?: string } | string;
  status: string;
  durationMs: number;
  retryCount: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
  steps: ExecStep[];
  onReplay?: () => void;
  replayLoading?: boolean;
}> = ({ id, rule, webhook, status, durationMs, retryCount, startedAt, completedAt, error, steps, onReplay, replayLoading }) => {
  const [open, setOpen] = useState(false);
  const [openStep, setOpenStep] = useState<number | null>(null);

  // Resolve populated or raw rule
  const ruleName        = typeof rule    === 'object' ? rule.name            : `Rule ${String(rule).slice(0, 8)}…`;
  const triggerSource   = typeof rule    === 'object' ? rule.triggerSource   : undefined;
  const triggerEvent    = typeof rule    === 'object' ? rule.triggerEventType: undefined;
  const ruleDescription = typeof rule    === 'object' ? rule.description     : undefined;

  // Resolve populated or raw webhook
  const webhookSource  = typeof webhook === 'object' ? webhook.source          : undefined;
  const webhookEventId = typeof webhook === 'object' ? webhook.eventIdentifier : undefined;

  const statusIcon = {
    completed:  <CheckCircle2 size={17} style={{ color: 'var(--green-400)', flexShrink: 0 }} />,
    failed:     <XCircle      size={17} style={{ color: 'var(--red-400)',   flexShrink: 0 }} />,
    processing: <Zap          size={17} style={{ color: '#818cf8',          flexShrink: 0 }} />,
    retrying:   <RotateCcw    size={17} style={{ color: 'var(--amber-400)', flexShrink: 0 }} />,
  }[status] ?? <Clock size={17} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />;

  return (
    <div className="event-row anim-fade-up">
      {/* ── Row head ── */}
      <div className="event-row-head" onClick={() => setOpen(v => !v)}>
        {statusIcon}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="t-h4" style={{ fontSize: 13 }}>{ruleName}</span>
            <StatusBadge status={status} pulse={status === 'processing'} />
            {triggerSource && (
              <SourceChip source={triggerSource} />
            )}
            {triggerEvent && (
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 5,
                background: 'rgba(99,102,241,0.12)', color: '#818cf8',
                letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>{triggerEvent}</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3, flexWrap: 'wrap' }}>
            <span className="mono t-micro">Run: {id.slice(0, 12)}…</span>
            {webhookEventId && (
              <span className="mono t-micro" style={{ color: 'var(--text-tertiary)' }}>Event: {webhookEventId}</span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{fmtMs(durationMs)}</p>
            <p className="t-micro">duration</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{steps.length}</p>
            <p className="t-micro">steps</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{retryCount}</p>
            <p className="t-micro">retries</p>
          </div>
          {open ? <ChevronUp size={14} style={{ color: 'var(--text-tertiary)' }} />
                : <ChevronDown size={14} style={{ color: 'var(--text-tertiary)' }} />}
        </div>
      </div>

      {/* ── Expanded body ── */}
      {open && (
        <div className="event-row-body anim-fade-up">
          {/* Meta grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 0, background: 'var(--bg-elevated)', borderRadius: 12,
            border: '1px solid var(--border-default)', marginBottom: 20, overflow: 'hidden',
          }}>
            {[
              { k: 'Execution ID',    v: <span className="mono" style={{ fontSize: 11 }}>{id}</span> },
              { k: 'Rule Name',       v: <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{ruleName}</span> },
              triggerSource ? { k: 'Trigger Source',  v: <SourceChip source={triggerSource} /> } : null,
              triggerEvent  ? { k: 'Event Type',      v: <span className="mono" style={{ fontSize: 11 }}>{triggerEvent}</span> } : null,
              webhookSource ? { k: 'Webhook Source',  v: <SourceChip source={webhookSource} /> } : null,
              webhookEventId? { k: 'Webhook Event ID',v: <span className="mono" style={{ fontSize: 11 }}>{webhookEventId}</span> } : null,
              { k: 'Status',         v: <StatusBadge status={status} pulse={status === 'processing'} /> },
              { k: 'Started',        v: fmtDate(startedAt) },
              completedAt   ? { k: 'Completed',       v: fmtDate(completedAt) } : null,
              { k: 'Duration',       v: fmtMs(durationMs) },
              { k: 'Retries',        v: String(retryCount) },
              { k: 'Steps Run',      v: String(steps.length) },
              ruleDescription ? { k: 'Rule Description', v: <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{ruleDescription}</span> } : null,
            ].filter(Boolean).map(({ k, v }: any) => (
              <div key={k} style={{ padding: '12px 16px', borderRight: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                <p className="t-label" style={{ marginBottom: 4 }}>{k}</p>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{v}</p>
              </div>
            ))}
          </div>

          {/* Error banner */}
          {error && (
            <div className="alert alert-error" style={{ marginBottom: 20 }}>
              <XCircle size={16} style={{ flexShrink: 0 }} />
              <div>
                <p style={{ fontWeight: 700, marginBottom: 4, fontSize: 12 }}>Execution Failed</p>
                <p className="mono" style={{ fontSize: 11, lineHeight: 1.7, wordBreak: 'break-all' }}>{error}</p>
              </div>
            </div>
          )}

          {/* Replay CTA */}
          {status === 'failed' && onReplay && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
              background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.18)',
              borderRadius: 14, padding: '16px 20px', marginBottom: 20,
            }}>
              <div>
                <p className="t-h4" style={{ marginBottom: 3 }}>Replay Failed Execution</p>
                <p className="t-small">Re-enqueue with the original payload. Steps that already completed will be skipped.</p>
              </div>
              <Btn variant="primary" onClick={onReplay} loading={replayLoading} icon={RotateCcw} style={{ flexShrink: 0 }}>
                Replay
              </Btn>
            </div>
          )}

          {/* Steps timeline */}
          <p className="t-label" style={{ marginBottom: 14 }}>Action Timeline · {steps.length} step{steps.length !== 1 ? 's' : ''}</p>

          {steps.length === 0 && (
            <p className="t-body" style={{ fontStyle: 'italic', fontSize: 12 }}>No steps logged — execution may have crashed before the action loop.</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {steps.map((step, idx) => {
              const isOpen = openStep === idx;
              const ok = step.status === 'success';
              return (
                <div key={idx} className="step-card">
                  <div className="step-card-head" onClick={() => setOpenStep(isOpen ? null : idx)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {ok
                        ? <CheckCircle2 size={14} style={{ color: 'var(--green-400)', flexShrink: 0 }} />
                        : <XCircle      size={14} style={{ color: 'var(--red-400)',   flexShrink: 0 }} />}
                      <span className="t-label" style={{
                        padding: '1px 7px', borderRadius: 4,
                        background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)',
                        color: 'var(--text-tertiary)',
                      }}>step {idx + 1}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {step.actionType.replace('_', ' ')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace' }}>
                        {fmtMs(step.durationMs)}
                      </span>
                      <StatusBadge status={step.status} />
                      {isOpen ? <ChevronUp size={12} style={{ color: 'var(--text-tertiary)' }} />
                               : <ChevronDown size={12} style={{ color: 'var(--text-tertiary)' }} />}
                    </div>
                  </div>
                  {isOpen && (
                    <div className="step-card-body anim-fade-in">
                      {step.error && (
                        <div className="alert alert-error" style={{ marginBottom: 12 }}>
                          <p className="mono" style={{ fontSize: 11, wordBreak: 'break-all' }}>{step.error}</p>
                        </div>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <JsonViewer data={step.requestPayload  ?? {}} label="Request Payload" maxHeight={220} />
                        <JsonViewer data={step.responsePayload ?? {}} label="Response Payload" maxHeight={220} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};


// ── EVENT CARD ───────────────────────────────────────────────────────────────
export const EventCard: React.FC<{
  source: string; eventType: string; eventIdentifier: string;
  status: string; retryCount: number; maxRetries: number;
  createdAt: string; error?: string; headers: any; payload: any;
}> = ({ source, eventType, eventIdentifier, status, retryCount, maxRetries, createdAt, error, headers, payload }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="event-row anim-fade-up">
      <div className="event-row-head" onClick={() => setOpen(v => !v)}>
        <SourceChip source={source} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="t-h4" style={{ fontSize: 13, marginBottom: 2 }}>{eventType}</p>
          <p className="mono t-micro">{eventIdentifier}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          {retryCount > 0 && (
            <span style={{ fontSize: 11, color: 'var(--amber-400)', fontWeight: 600 }}>
              {retryCount}/{maxRetries} retries
            </span>
          )}
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{fmtDate(createdAt)}</span>
          <StatusBadge status={status} />
          {open ? <ChevronUp size={14} style={{ color: 'var(--text-tertiary)' }} />
                : <ChevronDown size={14} style={{ color: 'var(--text-tertiary)' }} />}
        </div>
      </div>

      {open && (
        <div className="event-row-body anim-fade-in">
          {/* Meta */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
            borderRadius: 12, overflow: 'hidden', marginBottom: 16,
          }}>
            {[
              { k: 'Source',    v: source },
              { k: 'Event Type',v: eventType },
              { k: 'Received',  v: fmtDate(createdAt) },
              { k: 'Retries',   v: `${retryCount} / ${maxRetries}` },
            ].map(({ k, v }) => (
              <div key={k} style={{ padding: '11px 16px', borderRight: '1px solid var(--border-subtle)' }}>
                <p className="t-label" style={{ marginBottom: 3 }}>{k}</p>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{v}</p>
              </div>
            ))}
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>
              <XCircle size={14} style={{ flexShrink: 0 }} />
              <div>
                <p style={{ fontWeight: 700, fontSize: 12, marginBottom: 3 }}>Processing Error</p>
                <p className="mono" style={{ fontSize: 11, wordBreak: 'break-all', lineHeight: 1.7 }}>{error}</p>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <JsonViewer data={headers} label="Headers"  maxHeight={240} />
            <JsonViewer data={payload}  label="Payload" maxHeight={240} />
          </div>
        </div>
      )}
    </div>
  );
};

// ── STAT DISTRIBUTION ───────────────────────────────────────────────────────
export const StatDistribution: React.FC<{
  items: { label: string; value: number; status: StatusType }[];
}> = ({ items }) => {
  const total = items.reduce((s, i) => s + (i.value || 0), 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {items.map(({ label, value, status }) => {
        const pct = total > 0 ? Math.round((value / total) * 100) : 0;
        return (
          <div key={label} className="stat-row">
            <StatusBadge status={status} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                background: status === 'completed' ? 'var(--green-500)' : status === 'failed' ? 'var(--red-500)' : status === 'processing' ? 'var(--accent-500)' : status === 'retrying' ? 'var(--amber-500)' : 'var(--text-tertiary)',
                height: 4, borderRadius: 2, width: Math.max(pct * 0.8, 4), opacity: 0.65,
              }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', minWidth: 24, textAlign: 'right' }}>{value}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export { fmtDate, fmtMs };
