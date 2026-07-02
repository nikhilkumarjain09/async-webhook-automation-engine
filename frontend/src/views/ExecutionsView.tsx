import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlayCircle, AlertCircle } from 'lucide-react';
import { apiClient } from '../api/client';
import type { Execution } from '../types';
import {
  PageHeader, ExecutionCard, EmptyState, FilterBar,
  Select, Input, PaginationBar,
} from '../components/UI';

const STATUS_OPTIONS = [
  { value: '',           label: 'All Statuses' },
  { value: 'queued',     label: 'Queued' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed',  label: 'Completed' },
  { value: 'failed',     label: 'Failed' },
  { value: 'retrying',   label: 'Retrying' },
];

export const ExecutionsView: React.FC = () => {
  const qc = useQueryClient();
  const [page, setPage]           = useState(1);
  const LIMIT                     = 10;
  const [status, setStatus]       = useState('');
  const [ruleId, setRuleId]       = useState('');
  const [webhookId, setWebhookId] = useState('');
  const [replayingId, setReplayingId] = useState<string | null>(null);

  const { data: executions, isLoading, isError } = useQuery<Execution[]>({
    queryKey: ['executions', page, status, ruleId, webhookId],
    queryFn: async () => (await apiClient.get('/executions', {
      params: { page, limit: LIMIT, status: status || undefined, ruleId: ruleId || undefined, webhookEventId: webhookId || undefined },
    })).data,
    refetchInterval: 6000,
  });

  const replayMut = useMutation({
    mutationFn: async (id: string) => (await apiClient.post(`/executions/${id}/replay`, { reason: 'Manual trigger from dashboard' })).data,
    onMutate: (id) => setReplayingId(id),
    onSuccess: (data) => {
      alert(`Replay queued! ID: ${data?.data?._id ?? 'N/A'}`);
      qc.invalidateQueries({ queryKey: ['executions'] });
      qc.invalidateQueries({ queryKey: ['replays'] });
    },
    onError: (err: any) => alert(`Replay failed: ${err.response?.data?.message ?? err.message}`),
    onSettled: () => setReplayingId(null),
  });

  const reset = () => { setStatus(''); setRuleId(''); setWebhookId(''); setPage(1); };

  return (
    <div>
      <PageHeader
        title="Execution History"
        description="Expand any run to view the full step timeline, payloads, and error traces."
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
          label="Rule ID"
          value={ruleId}
          onChange={e => { setRuleId(e.target.value); setPage(1); }}
          placeholder="24-char Mongo ID"
          style={{ minWidth: 180 }}
        />
        <Input
          label="Webhook ID"
          value={webhookId}
          onChange={e => { setWebhookId(e.target.value); setPage(1); }}
          placeholder="24-char Mongo ID"
          style={{ minWidth: 180 }}
        />
      </FilterBar>

      <div className="mt-4 space-y-2.5">
        {isLoading && [1,2,3,4].map(n => (
          <div key={n} className="skeleton rounded-xl" style={{ height: 60 }} />
        ))}

        {isError && (
          <EmptyState
            icon={AlertCircle}
            title="Failed to load executions"
            description="Ensure the API server is reachable and your Tenant ID header is valid."
          />
        )}

        {!isLoading && !isError && (!executions || executions.length === 0) && (
          <EmptyState
            icon={PlayCircle}
            title="No executions found"
            description="Executions are created automatically when a matching webhook is received."
            action={<button className="btn-ghost" onClick={reset}>Reset filters</button>}
          />
        )}

        {!isLoading && executions?.map(exec => (
          <ExecutionCard
            key={exec._id}
            id={exec._id}
            ruleName={typeof exec.ruleId === 'object' ? exec.ruleId.name : `Rule ${exec.ruleId.slice(0, 8)}…`}
            webhookId={exec.webhookEventId}
            status={exec.status}
            durationMs={exec.durationMs}
            retryCount={exec.retryCount}
            startedAt={exec.startedAt}
            error={exec.error}
            steps={exec.steps}
            onReplay={exec.status === 'failed' ? () => replayMut.mutate(exec._id) : undefined}
            replayLoading={replayingId === exec._id}
          />
        ))}
      </div>

      <div className="mt-4 card" style={{ background: 'var(--bg-surface)' }}>
        <PaginationBar
          page={page}
          hasNext={Boolean(executions && executions.length === LIMIT)}
          onPrev={() => setPage(p => Math.max(p - 1, 1))}
          onNext={() => { if (executions && executions.length === LIMIT) setPage(p => p + 1); }}
        />
      </div>
    </div>
  );
};

export default ExecutionsView;
