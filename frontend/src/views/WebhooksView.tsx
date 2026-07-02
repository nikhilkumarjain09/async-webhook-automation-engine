import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Webhook, AlertCircle } from 'lucide-react';
import { apiClient } from '../api/client';
import type { WebhookEvent } from '../types';
import {
  PageHeader, EventCard, EmptyState, FilterBar,
  Select, Input, PaginationBar,
} from '../components/UI';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending',    label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed',  label: 'Completed' },
  { value: 'failed',     label: 'Failed' },
];

export const WebhooksView: React.FC = () => {
  const [page, setPage]           = useState(1);
  const LIMIT                     = 12;
  const [status, setStatus]       = useState('');
  const [source, setSource]       = useState('');
  const [eventType, setEventType] = useState('');

  const { data: events, isLoading, isError } = useQuery<WebhookEvent[]>({
    queryKey: ['webhooks', page, status, source, eventType],
    queryFn: async () => (await apiClient.get('/webhooks', {
      params: { page, limit: LIMIT, status: status || undefined, source: source || undefined, eventType: eventType || undefined },
    })).data,
    refetchInterval: 6000,
  });

  const reset = () => { setStatus(''); setSource(''); setEventType(''); setPage(1); };

  return (
    <div>
      <PageHeader
        title="Webhook Events"
        description="Inbound event log — click any row to inspect the payload."
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
          label="Source"
          value={source}
          onChange={e => { setSource(e.target.value); setPage(1); }}
          placeholder="stripe, github…"
          style={{ minWidth: 140 }}
        />
        <Input
          label="Event type"
          value={eventType}
          onChange={e => { setEventType(e.target.value); setPage(1); }}
          placeholder="payment_intent.succeeded"
          style={{ minWidth: 200 }}
        />
      </FilterBar>

      <div className="mt-4 space-y-2.5">
        {isLoading && (
          [1,2,3,4,5].map(n => (
            <div key={n} className="skeleton rounded-xl" style={{ height: 56 }} />
          ))
        )}

        {isError && (
          <EmptyState
            icon={AlertCircle}
            title="Failed to load webhook events"
            description="Ensure the API server is reachable and your Tenant ID header is valid."
          />
        )}

        {!isLoading && !isError && (!events || events.length === 0) && (
          <EmptyState
            icon={Webhook}
            title="No webhook events found"
            description="No events match your current filters. Try resetting to see all events."
            action={<button className="btn-ghost" onClick={reset}>Reset filters</button>}
          />
        )}

        {!isLoading && events?.map(ev => (
          <EventCard
            key={ev._id}
            id={ev._id}
            source={ev.source}
            eventType={ev.eventType}
            eventIdentifier={ev.eventIdentifier}
            status={ev.status}
            retryCount={ev.retryCount}
            maxRetries={ev.maxRetries}
            createdAt={ev.createdAt}
            error={ev.error}
            headers={ev.headers}
            payload={ev.payload}
          />
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-4 card" style={{ background: 'var(--bg-surface)' }}>
        <PaginationBar
          page={page}
          hasNext={Boolean(events && events.length === LIMIT)}
          onPrev={() => setPage(p => Math.max(p - 1, 1))}
          onNext={() => { if (events && events.length === LIMIT) setPage(p => p + 1); }}
        />
      </div>
    </div>
  );
};

export default WebhooksView;
