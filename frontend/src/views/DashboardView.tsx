import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Webhook, PlayCircle, Activity, Sliders,
  CheckCircle2, XCircle, Clock, RotateCcw,
  Zap, AlertTriangle, ArrowRight, RefreshCw,
} from 'lucide-react';
import { apiClient } from '../api/client';
import type { Execution } from '../types';
import {
  MetricCard, SectionCard, StatusBadge, PageHeader,
  EmptyState, SkeletonMetric, SkeletonRow, ErrorAlert,
  SourceChip, fmtDate, fmtMs,
} from '../components/UI';

export const DashboardView: React.FC = () => {
  const { data: stats, isLoading: sL, error: sE, refetch: sRefetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => (await apiClient.get('/dashboard/stats')).data,
    refetchInterval: 12000,
  });

  const { data: recent, isLoading: rL } = useQuery<Execution[]>({
    queryKey: ['recent-executions-dash'],
    queryFn: async () => (await apiClient.get('/executions', { params: { page: 1, limit: 8 } })).data,
    refetchInterval: 8000,
  });

  const { metrics = {}, webhooks = {}, executions = {}, rules = {} } = stats ?? {};

  const statusRow = (label: string, val: number, status: string) => (
    <div className="stat-row" key={label}>
      <StatusBadge status={status} />
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{val ?? 0}</span>
    </div>
  );

  if (sE) {
    return (
      <div className="error-page">
        <ErrorAlert
          title="Dashboard Unavailable"
          message='Failed to load dashboard data. Ensure the API server is running and your Tenant ID is valid in the sidebar.'
          action={
            <button className="btn btn-secondary btn-sm" onClick={() => sRefetch()}>
              <RefreshCw size={12} /> Retry
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Real-time telemetry across your automation pipeline — ingestion, processing, and execution health."
        badge={
          <span className="badge badge-active" style={{ verticalAlign: 'middle' }}>
            <span className="badge-dot" />
            Live
          </span>
        }
        action={
          <button className="btn btn-secondary btn-sm" onClick={() => sRefetch()}>
            <RefreshCw size={12} /> Refresh
          </button>
        }
      />

      {/* ── KPI Row 1 ──────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
        {sL ? (
          <><SkeletonMetric /><SkeletonMetric /><SkeletonMetric /><SkeletonMetric /></>
        ) : (
          <>
            <MetricCard
              title="Total Webhooks"
              value={metrics.totalWebhooks ?? 0}
              sub="All-time events ingested"
              icon={Webhook}
              accent="indigo"
            />
            <MetricCard
              title="Total Executions"
              value={metrics.totalExecutions ?? 0}
              sub="Automation runs triggered"
              icon={PlayCircle}
              accent="blue"
            />
            <MetricCard
              title="Success Rate"
              value={`${metrics.successRate ?? 0}%`}
              sub="Completed / total executions"
              icon={Activity}
              accent="green"
            />
            <MetricCard
              title="Active Rules"
              value={rules.active ?? 0}
              sub={`${rules.inactive ?? 0} inactive`}
              icon={Sliders}
              accent="purple"
            />
          </>
        )}
      </div>

      {/* ── KPI Row 2 ──────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 16, marginBottom: 28 }}>
        {sL ? (
          <><SkeletonMetric /><SkeletonMetric /><SkeletonMetric /><SkeletonMetric /></>
        ) : (
          <>
            <MetricCard title="Completed" value={executions.completed ?? 0} sub="Successful runs" icon={CheckCircle2} accent="green" />
            <MetricCard title="Failed"    value={executions.failed    ?? 0} sub="Require attention"icon={XCircle}      accent="red" />
            <MetricCard title="Retrying"  value={executions.retrying  ?? 0} sub="Back-off queue"   icon={RotateCcw}   accent="amber" />
            <MetricCard title="Queued"    value={executions.queued    ?? 0} sub="Waiting to run"   icon={Clock}       accent="indigo" />
          </>
        )}
      </div>

      {/* ── Middle row: Status breakdown + Recent webhook events ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Webhook pipeline status */}
        <SectionCard title="Webhook Pipeline" subtitle="Event ingestion by status" icon={Webhook}>
          <div style={{ padding: '4px 20px 16px' }}>
            {sL
              ? [1,2,3,4].map(n => <div key={n} className="skeleton" style={{ height: 16, marginBottom: 12 }} />)
              : <>
                  {statusRow('Completed', webhooks.completed, 'completed')}
                  {statusRow('Processing', webhooks.processing, 'processing')}
                  {statusRow('Pending', webhooks.pending, 'pending')}
                  {statusRow('Failed', webhooks.failed, 'failed')}
                </>}
          </div>
        </SectionCard>

        {/* Execution pipeline status */}
        <SectionCard title="Execution Pipeline" subtitle="Automation runs by status" icon={Zap}>
          <div style={{ padding: '4px 20px 16px' }}>
            {sL
              ? [1,2,3,4,5].map(n => <div key={n} className="skeleton" style={{ height: 16, marginBottom: 12 }} />)
              : <>
                  {statusRow('Completed', executions.completed, 'completed')}
                  {statusRow('Processing', executions.processing, 'processing')}
                  {statusRow('Retrying', executions.retrying, 'retrying')}
                  {statusRow('Queued', executions.queued, 'queued')}
                  {statusRow('Failed', executions.failed, 'failed')}
                </>}
          </div>
        </SectionCard>
      </div>

      {/* ── Recent Executions table ─────────────────────────────── */}
      <SectionCard
        title="Recent Executions"
        subtitle="Latest 8 automation runs across your rules"
        icon={PlayCircle}
        action={
          <Link
            to="/executions"
            className="btn btn-ghost btn-sm"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            View all <ArrowRight size={11} />
          </Link>
        }
        footer={
          <div style={{ padding: '10px 20px' }}>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Auto-refreshes every 8 seconds</span>
          </div>
        }
      >
        <div className="ae-table-container">
          <table className="ae-table">
            <thead>
              <tr>
                <th>Rule Name</th>
                <th>Source</th>
                <th>Event Type</th>
                <th>Webhook Event</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Steps</th>
                <th>Started</th>
              </tr>
            </thead>
            <tbody>
              {rL && [1,2,3,4,5].map(n => <SkeletonRow key={n} cols={7} />)}
              {!rL && (!recent || recent.length === 0) && (
                <tr>
                  <td colSpan={7} style={{ padding: 0 }}>
                    <EmptyState
                      icon={PlayCircle}
                      title="No executions yet"
                      description="Executions appear here automatically as webhooks are ingested and matched to rules."
                    />
                  </td>
                </tr>
              )}
              {!rL && recent?.map((ex) => {
                const rule    = typeof ex.ruleId        === 'object' ? ex.ruleId        : null;
                const webhook = typeof ex.webhookEventId === 'object' ? ex.webhookEventId : null;
                const ruleName = rule ? rule.name : `Rule ${String(ex.ruleId).slice(0, 8)}…`;
                return (
                  <tr key={ex._id}>
                    <td className="td-primary" style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ruleName}
                      {rule?.description && (
                        <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>
                          {rule.description}
                        </p>
                      )}
                    </td>
                    <td>
                      {rule?.triggerSource
                        ? <SourceChip source={rule.triggerSource} />
                        : <span className="mono" style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>—</span>}
                    </td>
                    <td>
                      {rule?.triggerEventType
                        ? <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 5, background: 'rgba(99,102,241,0.12)', color: '#818cf8', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{rule.triggerEventType}</span>
                        : <span className="mono" style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>—</span>}
                    </td>
                    <td className="mono" style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                      {webhook?.eventIdentifier
                        ? <span title={webhook.eventIdentifier}>{webhook.eventIdentifier.length > 22 ? webhook.eventIdentifier.slice(0, 22) + '…' : webhook.eventIdentifier}</span>
                        : String(ex.webhookEventId).slice(0, 12) + '…'}
                    </td>
                    <td><StatusBadge status={ex.status} pulse={ex.status === 'processing'} /></td>
                    <td className="mono" style={{ fontSize: 12 }}>{fmtMs(ex.durationMs)}</td>
                    <td style={{ textAlign: 'center' }}>{ex.steps?.length ?? 0}</td>
                    <td style={{ fontSize: 12 }}>{fmtDate(ex.startedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* ── Failures alert ──────────────────────────────────────── */}
      {!sL && (executions.failed ?? 0) > 0 && (
        <div className="alert alert-warning" style={{ marginTop: 20 }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, marginBottom: 2 }}>
              {executions.failed} failed execution{executions.failed !== 1 ? 's' : ''} require attention
            </p>
            <p style={{ fontSize: 12, opacity: 0.85 }}>
              Review your execution history to identify and replay failed jobs.
            </p>
          </div>
          <Link
            to="/executions"
            className="btn btn-secondary btn-sm"
            style={{ textDecoration: 'none', flexShrink: 0 }}
          >
            View Failures <ArrowRight size={11} />
          </Link>
        </div>
      )}
    </div>
  );
};

export default DashboardView;
