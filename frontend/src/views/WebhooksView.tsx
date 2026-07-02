import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Webhook } from 'lucide-react';
import { apiClient } from '../api/client';
import type { WebhookEvent } from '../types';
import {
  PageHeader, EventCard, EmptyState, FilterBar,
  Select, Input, Pagination, ErrorAlert,
} from '../components/UI';

const STATUS_OPTS = [
  { value: '',           label: 'All Statuses' },
  { value: 'pending',    label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed',  label: 'Completed' },
  { value: 'failed',     label: 'Failed' },
];

const LIMIT = 12;

export const WebhooksView: React.FC = () => {
  const [page, setPage]         = useState(1);
  const [status, setStatus]     = useState('');
  const [source, setSource]     = useState('');
  const [eventType, setEventType] = useState('');

  const { data, isLoading, isError, refetch } = useQuery<WebhookEvent[]>({
    queryKey: ['webhooks', page, status, source, eventType],
    queryFn: async () => (await apiClient.get('/webhooks', {
      params: {
        page, limit: LIMIT,
        status:    status    || undefined,
        source:    source    || undefined,
        eventType: eventType || undefined,
      },
    })).data,
    refetchInterval: 6000,
  });

  const reset = () => { setStatus(''); setSource(''); setEventType(''); setPage(1); };

  const hasFilters = !!(status || source || eventType);

  return (
    <div>
      <PageHeader
        title="Webhook Events"
        description="All inbound webhook events across every source. Click a row to inspect the raw payload, headers, and processing status."
        badge={
          <span className="badge badge-processing">
            <span className="badge-dot" />
            Live
          </span>
        }
      />

      {/* ── Filter bar ─────────────────────────────────────────── */}
      <FilterBar onReset={hasFilters ? reset : undefined}>
        <Select
          label="Status"
          options={STATUS_OPTS}
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          style={{ minWidth: 140 }}
        />
        <Input
          label="Source"
          value={source}
          onChange={e => { setSource(e.target.value); setPage(1); }}
          placeholder="stripe, github, shopify…"
          style={{ minWidth: 160 }}
        />
        <Input
          label="Event Type"
          value={eventType}
          onChange={e => { setEventType(e.target.value); setPage(1); }}
          placeholder="payment_intent.succeeded"
          style={{ minWidth: 220 }}
        />
      </FilterBar>

      {/* ── Content ────────────────────────────────────────────── */}
      {isError && (
        <ErrorAlert
          title="Failed to Load Webhook Events"
          message="Could not reach the API. Check your Tenant ID and that the backend is running."
          action={
            <button className="btn btn-secondary btn-sm" onClick={() => refetch()}>Retry</button>
          }
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {isLoading && [1,2,3,4,5,6].map(n => (
          <div key={n} className="skeleton" style={{ height: 54, borderRadius: 14 }} />
        ))}

        {!isLoading && !isError && (!data || data.length === 0) && (
          <div className="card-section">
            <EmptyState
              icon={Webhook}
              title={hasFilters ? 'No events match your filters' : 'No webhook events yet'}
              description={
                hasFilters
                  ? 'Try adjusting or resetting your filters to see more results.'
                  : 'Events will appear here as your sources send webhooks to the ingestion endpoint.'
              }
              action={hasFilters ? <button className="btn btn-secondary btn-sm" onClick={reset}>Reset Filters</button> : undefined}
            />
          </div>
        )}

        {!isLoading && !isError && data?.map(ev => (
          <EventCard
            key={ev._id}
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

      {/* ── Pagination ─────────────────────────────────────────── */}
      {!isError && (
        <div className="card-section" style={{ marginTop: 16 }}>
          <Pagination
            page={page}
            hasNext={Boolean(data && data.length === LIMIT)}
            onPrev={() => setPage(p => Math.max(1, p - 1))}
            onNext={() => { if (data && data.length === LIMIT) setPage(p => p + 1); }}
          />
        </div>
      )}
    </div>
  );
};

export default WebhooksView;
