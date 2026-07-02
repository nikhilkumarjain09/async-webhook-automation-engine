import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlayCircle } from 'lucide-react';
import { apiClient } from '../api/client';
import type { Execution } from '../types';
import {
  PageHeader, ExecutionCard, EmptyState, FilterBar,
  Select, Input, Pagination, ErrorAlert,
} from '../components/UI';

const STATUS_OPTS = [
  { value: '',           label: 'All Statuses' },
  { value: 'queued',     label: 'Queued' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed',  label: 'Completed' },
  { value: 'failed',     label: 'Failed' },
  { value: 'retrying',   label: 'Retrying' },
];

const LIMIT = 10;

export const ExecutionsView: React.FC = () => {
  const qc = useQueryClient();

  const [page, setPage]           = useState(1);
  const [status, setStatus]       = useState('');
  const [ruleId, setRuleId]       = useState('');
  const [webhookId, setWebhookId] = useState('');
  const [replayingId, setReplayingId] = useState<string | null>(null);

  const { data: executions, isLoading, isError, refetch } = useQuery<Execution[]>({
    queryKey: ['executions', page, status, ruleId, webhookId],
    queryFn: async () => (await apiClient.get('/executions', {
      params: {
        page, limit: LIMIT,
        status:        status    || undefined,
        ruleId:        ruleId    || undefined,
        webhookEventId: webhookId || undefined,
      },
    })).data,
    refetchInterval: 6000,
  });

  const replayMut = useMutation({
    mutationFn: async (id: string) =>
      (await apiClient.post(`/executions/${id}/replay`, { reason: 'Manual replay from dashboard' })).data,
    onMutate: (id) => setReplayingId(id),
    onSuccess: (data) => {
      const newId = data?.data?._id ?? 'N/A';
      alert(`✓ Replay queued successfully\nNew execution ID: ${newId}`);
      qc.invalidateQueries({ queryKey: ['executions'] });
      qc.invalidateQueries({ queryKey: ['replays'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (e: any) => alert(`Replay failed: ${e.response?.data?.message ?? e.message}`),
    onSettled: () => setReplayingId(null),
  });

  const reset = () => { setStatus(''); setRuleId(''); setWebhookId(''); setPage(1); };
  const hasFilters = !!(status || ruleId || webhookId);

  return (
    <div>
      <PageHeader
        title="Execution History"
        description="Full audit trail of every automation run. Expand any row to inspect step-by-step output, error traces, request/response payloads, and replay failed jobs."
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
          label="Rule ID"
          value={ruleId}
          onChange={e => { setRuleId(e.target.value); setPage(1); }}
          placeholder="24-char ObjectId"
          style={{ minWidth: 200 }}
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
          title="Failed to Load Executions"
          message="Could not reach the API. Verify your Tenant ID and that the backend is running."
          action={<button className="btn btn-secondary btn-sm" onClick={() => refetch()}>Retry</button>}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {isLoading && [1,2,3,4].map(n => (
          <div key={n} className="skeleton" style={{ height: 60, borderRadius: 14 }} />
        ))}

        {!isLoading && !isError && (!executions || executions.length === 0) && (
          <div className="card-section">
            <EmptyState
              icon={PlayCircle}
              title={hasFilters ? 'No executions match your filters' : 'No executions yet'}
              description={
                hasFilters
                  ? 'Adjust or reset your filters to see more results.'
                  : 'Executions are created automatically when an inbound webhook matches an active rule.'
              }
              action={hasFilters ? <button className="btn btn-secondary btn-sm" onClick={reset}>Reset Filters</button> : undefined}
            />
          </div>
        )}

        {!isLoading && !isError && executions?.map(ex => (
          <ExecutionCard
            key={ex._id}
            id={ex._id}
            rule={ex.ruleId}
            webhook={ex.webhookEventId}
            status={ex.status}
            durationMs={ex.durationMs}
            retryCount={ex.retryCount}
            startedAt={ex.startedAt}
            completedAt={ex.completedAt}
            error={ex.error}
            steps={ex.steps}
            onReplay={ex.status === 'failed' ? () => replayMut.mutate(ex._id) : undefined}
            replayLoading={replayingId === ex._id}
          />
        ))}
      </div>

      <div className="card-section" style={{ marginTop: 16 }}>
        <Pagination
          page={page}
          hasNext={Boolean(executions && executions.length === LIMIT)}
          onPrev={() => setPage(p => Math.max(1, p - 1))}
          onNext={() => { if (executions && executions.length === LIMIT) setPage(p => p + 1); }}
        />
      </div>
    </div>
  );
};

export default ExecutionsView;
