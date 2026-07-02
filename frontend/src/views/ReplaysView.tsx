import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RotateCcw } from 'lucide-react';
import { apiClient } from '../api/client';
import type { ReplayHistory } from '../types';
import {
  PageHeader, SectionCard, StatusBadge, EmptyState,
  FilterBar, Select, Input, Pagination, SkeletonRow, ErrorAlert,
} from '../components/UI';

const STATUS_OPTS = [
  { value: '',          label: 'All Statuses' },
  { value: 'triggered', label: 'Triggered' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed',    label: 'Failed' },
];

const LIMIT = 12;

export const ReplaysView: React.FC = () => {
  const [page, setPage]           = useState(1);
  const [status, setStatus]       = useState('');
  const [webhookId, setWebhookId] = useState('');

  const { data: replays, isLoading, isError, refetch } = useQuery<ReplayHistory[]>({
    queryKey: ['replays', page, status, webhookId],
    queryFn: async () => (await apiClient.get('/webhooks/replays', {
      params: {
        page, limit: LIMIT,
        status:       status    || undefined,
        webhookEventId: webhookId || undefined,
      },
    })).data,
    refetchInterval: 10000,
  });

  const reset = () => { setStatus(''); setWebhookId(''); setPage(1); };
  const hasFilters = !!(status || webhookId);

  return (
    <div>
      <PageHeader
        title="Replay Audit Log"
        description="Complete history of webhook replay events — both manually triggered replays from the Executions page and automated system retries after failure."
      />

      <FilterBar onReset={hasFilters ? reset : undefined}>
        <Select
          label="Status"
          options={STATUS_OPTS}
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          style={{ minWidth: 150 }}
        />
        <Input
          label="Webhook Event ID"
          value={webhookId}
          onChange={e => { setWebhookId(e.target.value); setPage(1); }}
          placeholder="24-char ObjectId"
          style={{ minWidth: 200 }}
        />
      </FilterBar>

      {isError && (
        <ErrorAlert
          title="Failed to Load Replay History"
          message="Could not reach the API. Check your Tenant ID and API connection."
          action={<button className="btn btn-secondary btn-sm" onClick={() => refetch()}>Retry</button>}
        />
      )}

      <SectionCard
        title="Replay Events"
        subtitle="All replay and retry records for this tenant"
        icon={RotateCcw}
        footer={
          <Pagination
            page={page}
            hasNext={Boolean(replays && replays.length === LIMIT)}
            onPrev={() => setPage(p => Math.max(1, p - 1))}
            onNext={() => { if (replays && replays.length === LIMIT) setPage(p => p + 1); }}
          />
        }
      >
        <div className="ae-table-container">
          <table className="ae-table">
            <thead>
              <tr>
                <th>Replay ID</th>
                <th>Webhook Event</th>
                <th>Triggered By</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && [1,2,3,4,5].map(n => <SkeletonRow key={n} cols={6} />)}

              {isError && (
                <tr>
                  <td colSpan={6} style={{ padding: 0 }}>
                    <EmptyState
                      icon={RotateCcw}
                      title="Unable to load replays"
                      description="An error occurred while fetching replay history."
                    />
                  </td>
                </tr>
              )}

              {!isLoading && !isError && (!replays || replays.length === 0) && (
                <tr>
                  <td colSpan={6} style={{ padding: 0 }}>
                    <EmptyState
                      icon={RotateCcw}
                      title={hasFilters ? 'No replays match your filters' : 'No replays recorded'}
                      description={
                        hasFilters
                          ? 'Adjust or reset your filters.'
                          : 'Replay events are created when you manually re-run a failed execution, or when the system automatically retries a failed job.'
                      }
                      action={hasFilters ? <button className="btn btn-secondary btn-sm" onClick={reset}>Reset Filters</button> : undefined}
                    />
                  </td>
                </tr>
              )}

              {!isLoading && !isError && replays?.map(r => (
                <tr key={r._id}>
                  <td className="mono" style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {r._id.slice(0, 12)}…
                  </td>
                  <td>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--accent-400)' }}>
                      {typeof r.webhookEventId === 'object'
                        ? r.webhookEventId.eventIdentifier
                        : `${String(r.webhookEventId).slice(0, 12)}…`}
                    </span>
                  </td>
                  <td className="td-primary" style={{ fontSize: 12 }}>{r.triggeredBy}</td>
                  <td style={{ maxWidth: 280 }}>
                    <span className="text-truncate" style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)' }}>
                      {r.reason}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                    {new Date(r.createdAt).toLocaleString('en-US', {
                      month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit', hour12: false,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
};

export default ReplaysView;
