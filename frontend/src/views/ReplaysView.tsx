import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RotateCcw, AlertCircle } from 'lucide-react';
import { apiClient } from '../api/client';
import type { ReplayHistory } from '../types';
import {
  PageHeader, SectionCard, SectionCardHeader, StatusBadge,
  EmptyState, FilterBar, Select, Input,
  PaginationBar, SkeletonRow,
} from '../components/UI';

const STATUS_OPTIONS = [
  { value: '',           label: 'All Statuses' },
  { value: 'triggered',  label: 'Triggered' },
  { value: 'completed',  label: 'Completed' },
  { value: 'failed',     label: 'Failed' },
];

export const ReplaysView: React.FC = () => {
  const [page, setPage]           = useState(1);
  const LIMIT                     = 12;
  const [status, setStatus]       = useState('');
  const [webhookId, setWebhookId] = useState('');

  const { data: replays, isLoading, isError } = useQuery<ReplayHistory[]>({
    queryKey: ['replays', page, status, webhookId],
    queryFn: async () => (await apiClient.get('/webhooks/replays', {
      params: { page, limit: LIMIT, status: status || undefined, webhookEventId: webhookId || undefined },
    })).data,
    refetchInterval: 10000,
  });

  const reset = () => { setStatus(''); setWebhookId(''); setPage(1); };

  return (
    <div>
      <PageHeader
        title="Replay Audit Log"
        description="History of manually triggered and automatically retried webhook replays."
      />

      <FilterBar onReset={reset}>
        <Select
          label="Status"
          options={STATUS_OPTIONS}
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          style={{ minWidth: 140 }}
        />
        <Input
          label="Webhook Event ID"
          value={webhookId}
          onChange={e => { setWebhookId(e.target.value); setPage(1); }}
          placeholder="24-char Mongo ID"
          style={{ minWidth: 200 }}
        />
      </FilterBar>

      <div className="mt-4">
        <SectionCard noPad>
          <SectionCardHeader
            title="Replay History"
            subtitle={`Showing page ${page}`}
            icon={RotateCcw}
          />

          <div style={{ overflowX: 'auto' }}>
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
                    <td colSpan={6} style={{ textAlign: 'center', padding: '48px 0' }}>
                      <EmptyState
                        icon={AlertCircle}
                        title="Failed to load replay history"
                        description="Check your API connection and Tenant ID."
                      />
                    </td>
                  </tr>
                )}

                {!isLoading && !isError && (!replays || replays.length === 0) && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '48px 0' }}>
                      <EmptyState
                        icon={RotateCcw}
                        title="No replays recorded"
                        description="Replay events are created when you manually trigger a re-run from the Executions page, or when the system automatically retries a failed job."
                        action={<button className="btn-ghost" onClick={reset}>Reset filters</button>}
                      />
                    </td>
                  </tr>
                )}

                {!isLoading && !isError && replays?.map(r => (
                  <tr key={r._id} className="anim-fade-up">
                    <td className="mono text-slate-400">{r._id.slice(0, 10)}…</td>
                    <td className="mono text-indigo-300 text-xs">
                      {typeof r.webhookEventId === 'object'
                        ? r.webhookEventId.eventIdentifier
                        : r.webhookEventId.slice(0, 10) + '…'}
                    </td>
                    <td className="text-slate-300 font-medium">{r.triggeredBy}</td>
                    <td className="text-slate-400 max-w-xs truncate">{r.reason}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td className="text-slate-500 text-xs">{new Date(r.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <PaginationBar
            page={page}
            hasNext={Boolean(replays && replays.length === LIMIT)}
            onPrev={() => setPage(p => Math.max(p - 1, 1))}
            onNext={() => { if (replays && replays.length === LIMIT) setPage(p => p + 1); }}
          />
        </SectionCard>
      </div>
    </div>
  );
};

export default ReplaysView;
