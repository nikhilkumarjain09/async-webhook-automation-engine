import React, { useState } from 'react';
import {
  CheckCircle2, XCircle, Clock, Zap,
  RotateCcw, Copy, Check, ChevronDown, ChevronUp,
  ArrowRight, Loader2, Inbox,
} from 'lucide-react';

// ─── STATUS BADGE ─────────────────────────────────────────────────────────
export type StatusType =
  | 'completed' | 'success' | 'active'
  | 'failed'    | 'error'
  | 'processing'
  | 'retrying'
  | 'queued'    | 'pending' | 'triggered'
  | 'inactive'
  | string;

interface StatusBadgeProps {
  status: StatusType;
  pulse?: boolean;
}
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, pulse = false }) => {
  const s = (status || '').toLowerCase();
  const cls = `badge badge-${s}`;

  let dot: React.ReactNode = null;
  if (s === 'processing') {
    dot = <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 dot-blink" />;
  } else if (s === 'completed' || s === 'success' || s === 'active') {
    dot = <span className={`inline-block w-1.5 h-1.5 rounded-full bg-green-400 ${pulse ? 'dot-pulse' : ''}`} />;
  } else if (s === 'failed' || s === 'error') {
    dot = <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400" />;
  } else if (s === 'retrying') {
    dot = <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 dot-blink" />;
  } else {
    dot = <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-500" />;
  }

  return (
    <span className={cls}>
      {dot}
      {status}
    </span>
  );
};

// ─── PAGE HEADER ──────────────────────────────────────────────────────────
interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
}
export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, action, badge }) => (
  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2.5">
        <h1 className="display-md text-white">{title}</h1>
        {badge}
      </div>
      {description && <p className="body-md text-sm">{description}</p>}
    </div>
    {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
  </div>
);

// ─── METRIC CARD ──────────────────────────────────────────────────────────
interface MetricCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent?: 'indigo' | 'green' | 'red' | 'amber' | 'neutral';
}
export const MetricCard: React.FC<MetricCardProps> = ({ title, value, sub, icon: Icon, accent = 'neutral' }) => {
  const accentMap: Record<string, string> = {
    indigo: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
    green:  'text-green-400  bg-green-400/10  border-green-400/20',
    red:    'text-red-400    bg-red-400/10    border-red-400/20',
    amber:  'text-amber-400  bg-amber-400/10  border-amber-400/20',
    neutral:'text-slate-400  bg-slate-400/10  border-slate-400/20',
  };
  const textMap: Record<string, string> = {
    indigo: 'text-indigo-300',
    green:  'text-green-300',
    red:    'text-red-300',
    amber:  'text-amber-300',
    neutral:'text-white',
  };

  return (
    <div className="metric-card">
      <div className="flex justify-between items-start gap-4">
        <div className="flex flex-col gap-3">
          <p className="label">{title}</p>
          <p className={`text-[2.25rem] font-bold tracking-tight leading-none ${textMap[accent]}`}>{value}</p>
          {sub && <p className="body-sm text-xs">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-10 border ${accentMap[accent]} flex-shrink-0`} style={{ borderRadius: 10 }}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
};

// ─── SECTION CARD ─────────────────────────────────────────────────────────
interface SectionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  noPad?: boolean;
}
export const SectionCard: React.FC<SectionCardProps> = ({ children, className = '', noPad = false, ...props }) => (
  <div className={`card ${noPad ? '' : 'p-0'} overflow-hidden ${className}`} {...props}>
    {children}
  </div>
);

// ─── SECTION CARD HEADER ──────────────────────────────────────────────────
interface SectionCardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  action?: React.ReactNode;
}
export const SectionCardHeader: React.FC<SectionCardHeaderProps> = ({ title, subtitle, icon: Icon, action }) => (
  <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
    <div className="flex items-center gap-2.5">
      {Icon && <Icon size={15} className="text-slate-500" />}
      <div>
        <p className="heading-sm text-white">{title}</p>
        {subtitle && <p className="body-sm mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action && <div>{action}</div>}
  </div>
);

// ─── EMPTY STATE ──────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}
export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon = Inbox, title, description, action }) => (
  <div className="flex flex-col items-center justify-center text-center py-16 px-6 gap-4 anim-fade-up">
    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
      <Icon size={22} className="text-slate-500" />
    </div>
    <div className="flex flex-col gap-1.5 max-w-xs">
      <p className="heading-sm text-white">{title}</p>
      <p className="body-sm leading-relaxed">{description}</p>
    </div>
    {action && <div className="mt-2">{action}</div>}
  </div>
);

// ─── LOADING SKELETON ─────────────────────────────────────────────────────
export const SkeletonRow: React.FC<{ cols?: number }> = ({ cols = 4 }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3.5">
        <div className={`skeleton h-4 ${i === 0 ? 'w-24' : i === cols - 1 ? 'w-16' : 'w-full'}`} />
      </td>
    ))}
  </tr>
);

export const SkeletonMetricCard: React.FC = () => (
  <div className="metric-card space-y-4">
    <div className="flex justify-between">
      <div className="skeleton h-3 w-20" />
      <div className="skeleton h-8 w-8 rounded-lg" />
    </div>
    <div className="skeleton h-9 w-16" />
    <div className="skeleton h-3 w-28" />
  </div>
);

export const SkeletonCard: React.FC = () => (
  <div className="card p-5 space-y-4">
    <div className="skeleton h-4 w-32" />
    <div className="skeleton h-3 w-full" />
    <div className="skeleton h-3 w-3/4" />
    <div className="flex gap-2 pt-2">
      <div className="skeleton h-7 w-20 rounded-full" />
      <div className="skeleton h-7 w-20 rounded-full" />
    </div>
  </div>
);

// ─── JSON VIEWER ──────────────────────────────────────────────────────────
export const JsonViewer: React.FC<{ data: any; label?: string }> = ({ data, label }) => {
  const [copied, setCopied] = useState(false);
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      {label && <p className="label mb-2">{label}</p>}
      <div className="json-viewer">{text}</div>
      <button
        onClick={copy}
        className="absolute top-2 right-2 btn-icon opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ width: 28, height: 28, borderRadius: 6 }}
        title="Copy"
      >
        {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
      </button>
    </div>
  );
};

// ─── BUTTON ───────────────────────────────────────────────────────────────
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
  loading?: boolean;
}
export const Btn: React.FC<BtnProps> = ({ variant = 'primary', loading = false, children, disabled, className = '', ...props }) => (
  <button
    className={`btn-${variant} ${className}`}
    disabled={disabled || loading}
    {...props}
  >
    {loading && <Loader2 size={13} className="spin" />}
    {children}
  </button>
);

// ─── PAGINATION BAR ───────────────────────────────────────────────────────
interface PaginationProps {
  page: number;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  total?: number;
}
export const PaginationBar: React.FC<PaginationProps> = ({ page, hasNext, onPrev, onNext, total }) => (
  <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: '1px solid var(--border)' }}>
    <p className="label">
      {total !== undefined ? `${total} results` : `Page ${page}`}
    </p>
    <div className="flex items-center gap-1.5">
      <button className="btn-icon" onClick={onPrev} disabled={page === 1}>
        <ChevronDown size={14} style={{ transform: 'rotate(90deg)' }} />
      </button>
      <span className="label px-2">{page}</span>
      <button className="btn-icon" onClick={onNext} disabled={!hasNext}>
        <ChevronDown size={14} style={{ transform: 'rotate(-90deg)' }} />
      </button>
    </div>
  </div>
);

// ─── SELECT ───────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { label: string; value: string }[];
}
export const Select: React.FC<SelectProps> = ({ label, options, className = '', ...props }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    {label && <label className="label">{label}</label>}
    <select className="input-base" style={{ appearance: 'none', cursor: 'pointer' }} {...props}>
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  </div>
);

// ─── INPUT ────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}
export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    {label && <label className="label">{label}</label>}
    <input className="input-base" {...props} />
  </div>
);

// ─── TEXTAREA ─────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}
export const Textarea: React.FC<TextareaProps> = ({ label, className = '', ...props }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    {label && <label className="label">{label}</label>}
    <textarea className="input-base" style={{ resize: 'vertical', minHeight: 72 }} {...props} />
  </div>
);

// ─── WORKFLOW CARD ────────────────────────────────────────────────────────
interface WorkflowStep {
  type: 'trigger' | 'condition' | 'action';
  label: string;
  sub?: string;
}
interface WorkflowCardProps {
  name: string;
  description?: string;
  status: string;
  steps: WorkflowStep[];
  onConfigure?: () => void;
}
export const WorkflowCard: React.FC<WorkflowCardProps> = ({ name, description, status, steps, onConfigure }) => {
  const typeStyles: Record<string, { dot: string; tag: string; label: string }> = {
    trigger:   { dot: 'bg-indigo-400', tag: 'bg-indigo-400/10 text-indigo-300 border-indigo-400/20', label: 'Trigger' },
    condition: { dot: 'bg-amber-400',  tag: 'bg-amber-400/10  text-amber-300  border-amber-400/20',  label: 'Filter' },
    action:    { dot: 'bg-green-400',  tag: 'bg-green-400/10  text-green-300  border-green-400/20',  label: 'Action' },
  };

  return (
    <div className="card p-5 flex flex-col gap-4 anim-fade-up hover:border-slate-600/50 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="heading-sm text-white leading-snug">{name}</p>
          {description && <p className="body-sm mt-1 leading-relaxed">{description}</p>}
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Workflow Steps */}
      <div className="flex flex-col" style={{ paddingLeft: 8 }}>
        {steps.map((step, i) => {
          const s = typeStyles[step.type] || typeStyles.action;
          const isLast = i === steps.length - 1;
          return (
            <div key={i} className="relative flex flex-col">
              {/* Step row */}
              <div className="flex items-center gap-2.5">
                {/* Left column: dot + vertical line */}
                <div className="flex flex-col items-center" style={{ width: 20, flexShrink: 0 }}>
                  <div className={`w-2 h-2 rounded-full ${s.dot} flex-shrink-0`} />
                  {!isLast && <div className="flex-1 w-px mt-1" style={{ height: 16, background: 'var(--border-light)' }} />}
                </div>
                {/* Content */}
                <div className="wf-step flex items-center gap-2 flex-1 min-w-0 mb-2">
                  <span className={`label px-1.5 py-0.5 rounded-md border ${s.tag} shrink-0`}>
                    {s.label}
                  </span>
                  <span className="text-xs font-medium text-white truncate">{step.label}</span>
                  {step.sub && <span className="text-xs text-slate-500 truncate hidden sm:block">{step.sub}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {onConfigure && (
        <div className="flex justify-end pt-1" style={{ borderTop: '1px solid var(--border)' }}>
          <button className="btn-ghost" style={{ padding: '5px 10px', fontSize: '0.75rem' }} onClick={onConfigure}>
            <ArrowRight size={13} /> Configure
          </button>
        </div>
      )}
    </div>
  );
};

// ─── EXECUTION CARD ───────────────────────────────────────────────────────
interface ExecStep {
  actionIndex: number;
  actionType: string;
  status: string;
  durationMs: number;
  error?: string;
  requestPayload?: any;
  responsePayload?: any;
  executedAt: string;
}
interface ExecutionCardProps {
  id: string;
  ruleName: string;
  webhookId: string;
  status: string;
  durationMs: number;
  retryCount: number;
  startedAt: string;
  error?: string;
  steps: ExecStep[];
  onReplay?: () => void;
  replayLoading?: boolean;
}
export const ExecutionCard: React.FC<ExecutionCardProps> = ({
  id, ruleName, webhookId, status, durationMs, retryCount,
  startedAt, error, steps, onReplay, replayLoading = false,
}) => {
  const [open, setOpen] = useState(false);
  const [openStep, setOpenStep] = useState<number | null>(null);

  return (
    <div className="event-row anim-fade-up">
      {/* Collapsed header */}
      <div className="event-row-header" onClick={() => setOpen(!open)}>
        {/* Status col */}
        <div className="flex-shrink-0">
          {status === 'completed' && <CheckCircle2 size={18} className="text-green-400" />}
          {status === 'failed'    && <XCircle      size={18} className="text-red-400" />}
          {status === 'processing'&& <Zap          size={18} className="text-indigo-400" />}
          {status === 'retrying'  && <RotateCcw    size={18} className="text-amber-400" />}
          {(status === 'queued' || status === 'pending') && <Clock size={18} className="text-slate-500" />}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="heading-sm text-white truncate">{ruleName}</p>
            <StatusBadge status={status} pulse={status === 'processing'} />
          </div>
          <p className="body-sm text-xs mt-0.5 mono truncate">{id}</p>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-6 text-right flex-shrink-0">
          <div>
            <p className="text-xs font-semibold text-white">{durationMs}ms</p>
            <p className="label">duration</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-white">{retryCount}</p>
            <p className="label">retries</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">{steps.length}</p>
            <p className="label">steps</p>
          </div>
        </div>

        <div className="flex-shrink-0 text-slate-500">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Expanded body */}
      {open && (
        <div className="anim-fade-up" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-base)', padding: '20px 20px 20px 20px' }}>
          {/* Meta row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            <div>
              <p className="label mb-1">Started</p>
              <p className="text-xs font-medium text-slate-300">{new Date(startedAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="label mb-1">Webhook ID</p>
              <p className="mono text-slate-400 truncate">{webhookId}</p>
            </div>
            <div>
              <p className="label mb-1">Duration</p>
              <p className="text-xs font-medium text-slate-300">{durationMs}ms</p>
            </div>
            <div>
              <p className="label mb-1">Retries</p>
              <p className="text-xs font-medium text-slate-300">{retryCount}</p>
            </div>
          </div>

          {/* Replay CTA */}
          {status === 'failed' && onReplay && (
            <div className="flex items-center justify-between gap-4 rounded-xl mb-5 p-4"
              style={{ background: 'rgba(88,101,242,0.06)', border: '1px solid rgba(88,101,242,0.15)' }}>
              <div>
                <p className="heading-sm text-white">Retry this execution</p>
                <p className="body-sm mt-0.5">Re-run failed steps using the original payload — completed steps are skipped.</p>
              </div>
              <Btn variant="primary" onClick={onReplay} loading={replayLoading} className="shrink-0">
                <RotateCcw size={13} /> Replay
              </Btn>
            </div>
          )}

          {/* Error trace */}
          {error && (
            <div className="rounded-xl mb-5 p-4" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <p className="label text-red-400 mb-1.5">Fatal Error</p>
              <p className="mono text-red-300 leading-relaxed break-all text-xs">{error}</p>
            </div>
          )}

          {/* Steps timeline */}
          <p className="label mb-4">Action Timeline ({steps.length} steps)</p>
          <div className="relative ml-3 space-y-3">
            {steps.length === 0 && (
              <p className="body-sm italic">No steps executed — crash occurred before action loop.</p>
            )}
            {steps.map((step, idx) => {
              const isStepOpen = openStep === idx;
              const isSuccess = step.status === 'success';
              return (
                <div key={idx} className="relative flex gap-4">
                  {/* Vertical line */}
                  {idx < steps.length - 1 && (
                    <div style={{ position: 'absolute', left: 11, top: 24, width: 1, bottom: -12, background: 'var(--border)' }} />
                  )}
                  {/* Dot */}
                  <div className={`timeline-dot flex-shrink-0 ${
                    isSuccess ? 'bg-green-400/10 border-green-400 text-green-400' : 'bg-red-400/10 border-red-400 text-red-400'
                  }`} style={{ marginTop: 2 }}>
                    {isSuccess ? <Check size={10} /> : <XCircle size={10} />}
                  </div>

                  {/* Card */}
                  <div className="flex-1 min-w-0 rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                    <div
                      className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer"
                      style={{ background: 'var(--bg-surface)' }}
                      onClick={() => setOpenStep(isStepOpen ? null : idx)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="label px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                          step {idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-white uppercase tracking-wider">{step.actionType}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-xs text-slate-500">{step.durationMs}ms</span>
                        <StatusBadge status={step.status} />
                        {isStepOpen ? <ChevronUp size={13} className="text-slate-500" /> : <ChevronDown size={13} className="text-slate-500" />}
                      </div>
                    </div>
                    {isStepOpen && (
                      <div className="p-4 space-y-3 anim-fade-up" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-base)' }}>
                        {step.error && (
                          <div className="p-3 rounded-lg text-xs mono text-red-300 leading-relaxed break-all"
                            style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                            {step.error}
                          </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <JsonViewer data={step.requestPayload ?? {}} label="Request" />
                          <JsonViewer data={step.responsePayload ?? {}} label="Response" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── EVENT CARD ───────────────────────────────────────────────────────────
interface EventCardProps {
  id?: string;
  source: string;
  eventType: string;
  eventIdentifier: string;
  status: string;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  error?: string;
  headers: any;
  payload: any;
}
export const EventCard: React.FC<EventCardProps> = ({
  id: _id, source, eventType, eventIdentifier, status,
  retryCount, maxRetries, createdAt, error, headers, payload,
}) => {
  const [open, setOpen] = useState(false);

  const sourceColor: Record<string, string> = {
    stripe: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
    github: 'text-slate-200 bg-slate-200/10 border-slate-200/20',
    shopify:'text-green-400  bg-green-400/10  border-green-400/20',
    slack:  'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  };
  const srcKey = source.toLowerCase();
  const srcStyle = sourceColor[srcKey] || 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20';

  return (
    <div className="event-row anim-fade-up">
      <div className="event-row-header" onClick={() => setOpen(!open)}>
        {/* Source chip */}
        <div className={`flex-shrink-0 px-2.5 py-1 rounded-lg border text-xs font-bold uppercase tracking-wider ${srcStyle}`} style={{ minWidth: 60, textAlign: 'center' }}>
          {source}
        </div>

        {/* Event info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{eventType}</p>
          <p className="mono text-slate-500 text-xs mt-0.5 truncate">{eventIdentifier}</p>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <span className="hidden sm:block text-xs text-slate-500 font-mono">
            {new Date(createdAt).toLocaleTimeString()}
          </span>
          {retryCount > 0 && (
            <span className="hidden sm:block text-xs text-slate-500">
              {retryCount}/{maxRetries} retries
            </span>
          )}
          <StatusBadge status={status} />
          <div className="text-slate-500">
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </div>

      {open && (
        <div className="p-5 space-y-5 anim-fade-up" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-base)' }}>
          {/* Metadata grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-xl p-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <div><p className="label mb-1">Source</p><p className="text-xs font-medium text-slate-300">{source}</p></div>
            <div><p className="label mb-1">Event Type</p><p className="text-xs font-medium text-slate-300">{eventType}</p></div>
            <div><p className="label mb-1">Received</p><p className="text-xs font-medium text-slate-300">{new Date(createdAt).toLocaleString()}</p></div>
            <div><p className="label mb-1">Retries</p><p className="text-xs font-medium text-slate-300">{retryCount} / {maxRetries}</p></div>
          </div>

          {error && (
            <div className="p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <p className="label text-red-400 mb-1.5">Processing Error</p>
              <p className="mono text-red-300 text-xs leading-relaxed break-all">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <JsonViewer data={headers} label="Headers" />
            <JsonViewer data={payload}  label="Payload" />
          </div>
        </div>
      )}
    </div>
  );
};

// ─── FILTER BAR ───────────────────────────────────────────────────────────
interface FilterBarProps {
  children: React.ReactNode;
  onReset?: () => void;
}
export const FilterBar: React.FC<FilterBarProps> = ({ children, onReset }) => (
  <div className="flex flex-wrap items-end gap-3 p-4 rounded-xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
    {children}
    {onReset && (
      <button className="btn-ghost" style={{ padding: '7px 12px', height: 34, alignSelf: 'flex-end' }} onClick={onReset}>
        Reset
      </button>
    )}
  </div>
);

// ─── MODAL ────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
  size?: 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}
export const Modal: React.FC<ModalProps> = ({ open, onClose, title, subtitle, footer, size = 'md', children }) => {
  if (!open) return null;
  const maxW: Record<string, string> = { md: '540px', lg: '680px', xl: '820px' };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel" style={{ maxWidth: maxW[size] }}>
        <div className="modal-header">
          <div>
            <p className="heading-lg text-white">{title}</p>
            {subtitle && <p className="body-sm mt-0.5">{subtitle}</p>}
          </div>
          <button className="btn-icon" onClick={onClose}>
            <XCircle size={16} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};
