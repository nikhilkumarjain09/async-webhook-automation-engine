import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Webhook, PlayCircle, Activity, TrendingUp,
  CheckCircle2, XCircle, Clock, ArrowRight,
} from 'lucide-react';
import { apiClient } from '../api/client';
import type { Execution } from '../types';
import {
  MetricCard, SectionCard, SectionCardHeader, StatusBadge,
  PageHeader, EmptyState, SkeletonMetricCard, SkeletonRow,
} from '../components/UI';

export const DashboardView: React.FC = () => {
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => (await apiClient.get('/dashboard/stats')).data,
    refetchInterval: 10000,
  });

  const { data: recent, isLoading: recentLoading } = useQuery<Execution[]>({
    queryKey: ['recent-executions'],
    queryFn: async () => (await apiClient.get('/executions', { params: { page: 1, limit: 6 } })).data,
    refetchInterval: 8000,
  });

  if (statsError) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <EmptyState
          icon={XCircle}
          title="Failed to load dashboard"
          description="Check that the backend is running and your Tenant ID is valid. Refresh to retry."
        />
      </div>
    );
  }

  const { metrics, webhooks, executions, rules } = stats ?? { metrics: {}, webhooks: {}, executions: {}, rules: {} };

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Live automation throughput and ingestion health overview."
        badge={
          <span className="badge badge-active" style={{ verticalAlign: 'middle' }}>
            <span className="live-dot" style={{ width: 6, height: 6, display: 'inline-block', borderRadius: '50%', background: 'var(--success)' }} />
            Live
          </span>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {statsLoading ? (
          <>
            <SkeletonMetricCard /><SkeletonMetricCard /><SkeletonMetricCard />
          </>
        ) : (
          <>
            <MetricCard
              title="Ingested Webhooks"
              value={metrics?.totalWebhooks ?? 0}
              sub="Total payloads received"
              icon={Webhook}
              accent="indigo"
            />
            <MetricCard
              title="Rule Executions"
              value={metrics?.totalExecutions ?? 0}
              sub="Across all automation rules"
              icon={PlayCircle}
              accent="neutral"
            />
            <MetricCard
              title="Success Rate"
              value={`${metrics?.successRate ?? 0}%`}
              sub="Completed vs total runs"
              icon={Activity}
              accent="green"
            />
          </>
        )}
      </div>

      {/* Status breakdown + rule inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Webhooks status */}
        <SectionCard>
          <SectionCardHeader title="Webhook Ingestion" subtitle="Breakdown by pipeline status" icon={Webhook} />
          <div className="p-5 space-y-3">
            {statsLoading ? (
              [1,2,3,4].map(n => <div key={n} className="skeleton h-4 w-full" />)
            ) : (
              [
                { label: 'Completed', val: webhooks?.completed, s: 'completed' },
                { label: 'Processing', val: webhooks?.processing, s: 'processing' },
                { label: 'Pending',    val: webhooks?.pending,   s: 'pending' },
                { label: 'Failed',     val: webhooks?.failed,    s: 'failed' },
              ].map(({ label, val, s }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <StatusBadge status={s} />
                  <span className="text-sm font-semibold text-white">{val ?? 0}</span>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        {/* Executions status */}
        <SectionCard>
          <SectionCardHeader title="Execution Runs" subtitle="Breakdown by pipeline status" icon={PlayCircle} />
          <div className="p-5 space-y-3">
            {statsLoading ? (
              [1,2,3,4,5].map(n => <div key={n} className="skeleton h-4 w-full" />)
            ) : (
              [
                { label: 'Completed', val: executions?.completed, s: 'completed' },
                { label: 'Processing', val: executions?.processing, s: 'processing' },
                { label: 'Queued',    val: executions?.queued,    s: 'queued' },
                { label: 'Retrying',  val: executions?.retrying,  s: 'retrying' },
                { label: 'Failed',    val: executions?.failed,    s: 'failed' },
              ].map(({ label, val, s }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <StatusBadge status={s} />
                  <span className="text-sm font-semibold text-white">{val ?? 0}</span>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        {/* Rules inventory */}
        <SectionCard>
          <SectionCardHeader title="Automation Rules" subtitle="Configured rule inventory" icon={TrendingUp} />
          <div className="p-5 space-y-4">
            {statsLoading ? (
              [1,2].map(n => <div key={n} className="skeleton h-6 w-full" />)
            ) : (
              <>
                <div className="flex items-center justify-between rounded-xl p-3.5"
                  style={{ background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.12)' }}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-green-400" />
                    <span className="text-sm font-medium text-slate-300">Active Rules</span>
                  </div>
                  <span className="text-xl font-bold text-green-300">{rules?.active ?? 0}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl p-3.5"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2">
                    <Clock size={15} className="text-slate-500" />
                    <span className="text-sm font-medium text-slate-400">Inactive Rules</span>
                  </div>
                  <span className="text-xl font-bold text-slate-400">{rules?.inactive ?? 0}</span>
                </div>
              </>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Recent executions table */}
      <SectionCard noPad>
        <SectionCardHeader
          title="Recent Executions"
          subtitle="Last 6 automation runs"
          icon={Clock}
          action={
            <Link to="/executions" className="btn-ghost" style={{ padding: '5px 10px', fontSize: '0.75rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              View all <ArrowRight size={12} />
            </Link>
          }
        />
        <div style={{ overflowX: 'auto' }}>
          <table className="ae-table">
            <thead>
              <tr>
                <th>Run ID</th>
                <th>Rule</th>
                <th>Duration</th>
                <th>Retries</th>
                <th>Status</th>
                <th>Started At</th>
              </tr>
            </thead>
            <tbody>
              {recentLoading && [1,2,3,4].map(n => <SkeletonRow key={n} cols={6} />)}
              {!recentLoading && (!recent || recent.length === 0) && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px 0' }}>
                    <EmptyState
                      icon={PlayCircle}
                      title="No executions yet"
                      description="Automation runs will appear here once webhooks are ingested."
                    />
                  </td>
                </tr>
              )}
              {!recentLoading && recent?.map(exec => (
                <tr key={exec._id}>
                  <td className="mono text-slate-400">{exec._id.slice(0, 10)}…</td>
                  <td className="text-white font-medium">
                    {typeof exec.ruleId === 'object' ? exec.ruleId.name : exec.ruleId.slice(0, 10) + '…'}
                  </td>
                  <td className="font-mono font-medium text-slate-300">{exec.durationMs}ms</td>
                  <td className="text-slate-400">{exec.retryCount}</td>
                  <td><StatusBadge status={exec.status} /></td>
                  <td className="text-slate-500 text-xs">{new Date(exec.startedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
};

export default DashboardView;
