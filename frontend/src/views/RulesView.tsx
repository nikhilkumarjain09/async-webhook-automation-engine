import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Sliders, XCircle, Trash2, AlertTriangle } from 'lucide-react';
import { apiClient } from '../api/client';
import type { AutomationRule, RuleCondition, RuleAction } from '../types';
import {
  PageHeader, WorkflowCard, EmptyState, Select, Input, Textarea,
  Btn, Modal, JsonViewer, Pagination, SkeletonCard, ErrorAlert, StatusBadge,
} from '../components/UI';

const STATUS_OPTS = [
  { value: '',         label: 'All rules' },
  { value: 'active',   label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];
const OPERATOR_OPTS = [
  { value: 'equals',      label: 'equals' },
  { value: 'contains',    label: 'contains' },
  { value: 'greaterThan', label: 'greater than' },
];
const ACTION_TYPE_OPTS = [
  { value: 'http_call',    label: 'HTTP Call' },
  { value: 'email_send',   label: 'Email (mock)' },
  { value: 'slack_notify', label: 'Slack (mock)' },
  { value: 'db_operation', label: 'DB Operation (mock)' },
];
const METHOD_OPTS = [
  { value: 'POST',   label: 'POST' },
  { value: 'GET',    label: 'GET' },
  { value: 'PUT',    label: 'PUT' },
  { value: 'PATCH',  label: 'PATCH' },
  { value: 'DELETE', label: 'DELETE' },
];

const LIMIT = 10;

const buildSteps = (rule: AutomationRule) => [
  { type: 'trigger'   as const, label: `${rule.triggerSource} → ${rule.triggerEventType}` },
  ...rule.conditions.map(c => ({ type: 'condition' as const, label: `${c.field} ${c.operator} ${c.value}` })),
  ...rule.actions.map(a => ({
    type: 'action' as const,
    label: a.actionType.replace('_', ' '),
    sub: a.config?.url || a.config?.to || '',
  })),
];

export const RulesView: React.FC = () => {
  const qc = useQueryClient();

  const [page, setPage]     = useState(1);
  const [status, setStatus] = useState('');
  const [viewRule, setViewRule]   = useState<AutomationRule | null>(null);
  const [createOpen, setCreate]   = useState(false);

  // Form state
  const [fName, setFName]   = useState('');
  const [fDesc, setFDesc]   = useState('');
  const [fSrc,  setFSrc]    = useState('');
  const [fEvt,  setFEvt]    = useState('');
  const [conds, setConds]   = useState<RuleCondition[]>([]);
  const [acts,  setActs]    = useState<RuleAction[]>([]);

  // Temp condition
  const [cf, setCf] = useState('');
  const [cop, setCop] = useState<RuleCondition['operator']>('equals');
  const [cv, setCv]   = useState('');

  // Temp action
  const [at,      setAt]      = useState<RuleAction['actionType']>('http_call');
  const [aUrl,    setAUrl]    = useState('');
  const [aMeth,   setAMeth]   = useState('POST');
  const [aHdr,    setAHdr]    = useState('{}');
  const [aBody,   setABody]   = useState('{}');
  const [aEmail,  setAEmail]  = useState('');
  const [aSubj,   setASubj]   = useState('');
  const [aEBody,  setAEBody]  = useState('');

  const resetForm = () => {
    setFName(''); setFDesc(''); setFSrc(''); setFEvt('');
    setConds([]); setActs([]);
    setCf(''); setCv('');
    setAUrl(''); setAEmail(''); setASubj(''); setAEBody('');
    setAHdr('{}'); setABody('{}');
  };

  const { data: rules, isLoading, isError } = useQuery<AutomationRule[]>({
    queryKey: ['rules', page, status],
    queryFn: async () => (await apiClient.get('/rules', {
      params: { page, limit: LIMIT, status: status || undefined },
    })).data,
  });

  const createMut = useMutation({
    mutationFn: async (dto: any) => (await apiClient.post('/rules', dto)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rules'] });
      setCreate(false);
      resetForm();
    },
    onError: (e: any) => alert(`Failed: ${e.response?.data?.message ?? e.message}`),
  });

  const addCond = () => {
    if (!cf || !cv) return;
    setConds(p => [...p, { field: cf, operator: cop, value: cv }]);
    setCf(''); setCv('');
  };
  const removeCond = (i: number) => setConds(p => p.filter((_, j) => j !== i));

  const addAct = () => {
    let config: Record<string, any> = {};
    if (at === 'http_call') {
      try { config = { url: aUrl, method: aMeth, headers: JSON.parse(aHdr), body: JSON.parse(aBody) }; }
      catch { alert('Invalid JSON in headers or body'); return; }
    } else if (at === 'email_send') {
      config = { to: aEmail, subject: aSubj, body: aEBody };
    } else {
      config = { note: 'Mock action — no real integration' };
    }
    setActs(p => [...p, { order: p.length, actionType: at, config }]);
    setAUrl(''); setAEmail(''); setASubj(''); setAEBody('');
  };
  const removeAct = (i: number) =>
    setActs(p => p.filter((_, j) => j !== i).map((a, j) => ({ ...a, order: j })));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fName || !fSrc || !fEvt) return alert('Name, trigger source, and event type are required.');
    if (acts.length === 0) return alert('Add at least one action step.');
    createMut.mutate({ name: fName, description: fDesc, triggerSource: fSrc, triggerEventType: fEvt, status: 'active', conditions: conds, actions: acts });
  };

  return (
    <div>
      <PageHeader
        title="Automation Rules"
        description="Define event-driven pipelines. Each rule listens for a trigger, evaluates optional conditions, and executes a sequence of actions."
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Select
              options={STATUS_OPTS}
              value={status}
              onChange={e => { setStatus(e.target.value); setPage(1); }}
              style={{ minWidth: 140, margin: 0 }}
            />
            <Btn variant="primary" icon={Plus} onClick={() => setCreate(true)}>New Rule</Btn>
          </div>
        }
      />

      {isError && <ErrorAlert title="Failed to load rules" message="Check your Tenant ID and API connection." />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16, marginBottom: 16 }}>
        {isLoading && [1,2,3,4].map(n => <SkeletonCard key={n} />)}

        {!isLoading && !isError && (!rules || rules.length === 0) && (
          <div style={{ gridColumn: '1 / -1' }} className="card-section">
            <EmptyState
              icon={Sliders}
              title="No automation rules"
              description="Create your first rule to start routing webhook events to downstream actions."
              action={<Btn variant="primary" icon={Plus} onClick={() => setCreate(true)}>Create First Rule</Btn>}
            />
          </div>
        )}

        {rules?.map(rule => (
          <WorkflowCard
            key={rule._id}
            name={rule.name}
            description={rule.description}
            status={rule.status}
            steps={buildSteps(rule)}
            onView={() => setViewRule(rule)}
          />
        ))}
      </div>

      <div className="card-section">
        <Pagination
          page={page}
          hasNext={Boolean(rules && rules.length === LIMIT)}
          onPrev={() => setPage(p => Math.max(1, p - 1))}
          onNext={() => { if (rules && rules.length === LIMIT) setPage(p => p + 1); }}
        />
      </div>

      {/* ── View Rule Detail ─────────────────────────────────────── */}
      <Modal
        open={!!viewRule}
        onClose={() => setViewRule(null)}
        title={viewRule?.name ?? ''}
        subtitle="Automation rule configuration"
        size="lg"
        footer={<Btn variant="ghost" onClick={() => setViewRule(null)}>Close</Btn>}
      >
        {viewRule && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Meta */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0,
              background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
              borderRadius: 12, overflow: 'hidden',
            }}>
              {[
                { k: 'Status',         v: <StatusBadge status={viewRule.status} /> },
                { k: 'Trigger Source', v: <span className="mono" style={{ fontSize: 12 }}>{viewRule.triggerSource}</span> },
                { k: 'Event Type',     v: <span className="mono" style={{ fontSize: 12, color: 'var(--accent-400)' }}>{viewRule.triggerEventType}</span> },
                { k: 'Created',        v: <span style={{ fontSize: 12 }}>{new Date(viewRule.createdAt).toLocaleDateString()}</span> },
              ].map(({ k, v }) => (
                <div key={k} style={{ padding: '12px 16px', borderRight: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <p className="t-label" style={{ marginBottom: 5 }}>{k}</p>
                  <div>{v}</div>
                </div>
              ))}
            </div>

            {/* Description */}
            {viewRule.description && (
              <div className="card-inset" style={{ padding: 14 }}>
                <p className="t-small" style={{ lineHeight: 1.6 }}>{viewRule.description}</p>
              </div>
            )}

            {/* Conditions */}
            <div>
              <p className="t-label" style={{ marginBottom: 10 }}>Filter Conditions · {viewRule.conditions.length}</p>
              {viewRule.conditions.length === 0 ? (
                <p className="t-small" style={{ fontStyle: 'italic' }}>No conditions — fires on every matching event type.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {viewRule.conditions.map((c, i) => (
                    <div key={i} className="card-inset" style={{ padding: '10px 13px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="mono" style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>{c.field}</span>
                      <span className="badge badge-processing" style={{ textTransform: 'none', fontSize: 10 }}>{c.operator}</span>
                      <span className="mono" style={{ fontSize: 12, color: 'var(--green-400)' }}>{c.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div>
              <p className="t-label" style={{ marginBottom: 10 }}>Action Steps · {viewRule.actions.length}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {viewRule.actions.map((a, i) => (
                  <div key={i} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--border-default)', background: 'var(--bg-card)' }}>
                      <span className="t-label" style={{ padding: '1px 7px', borderRadius: 4, background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)' }}>step {i + 1}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)' }}>{a.actionType}</span>
                    </div>
                    <div style={{ padding: 12 }}>
                      <JsonViewer data={a.config} maxHeight={160} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Create Rule ──────────────────────────────────────────── */}
      <Modal
        open={createOpen}
        onClose={() => { setCreate(false); resetForm(); }}
        title="Create Automation Rule"
        subtitle="Define a trigger source, optional conditions, and one or more action steps."
        size="xl"
        footer={
          <>
            <Btn variant="ghost" onClick={() => { setCreate(false); resetForm(); }}>Cancel</Btn>
            <Btn variant="primary" onClick={handleSubmit} loading={createMut.isPending}>Save Rule</Btn>
          </>
        }
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Basic */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Rule Name *" value={fName} onChange={e => setFName(e.target.value)} placeholder="e.g. Stripe → Slack Alert" required />
            <Input label="Description" value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="What does this rule do?" />
          </div>

          {/* Trigger */}
          <div className="form-section">
            <div className="form-section-title" style={{ color: 'var(--accent-400)' }}>
              <Sliders size={12} /> Trigger
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Source *" value={fSrc} onChange={e => setFSrc(e.target.value)} placeholder="stripe, github, shopify…" required />
              <Input label="Event Type *" value={fEvt} onChange={e => setFEvt(e.target.value)} placeholder="payment_intent.succeeded" required />
            </div>
          </div>

          {/* Conditions */}
          <div className="form-section">
            <div className="form-section-title" style={{ color: 'var(--amber-400)' }}>
              <AlertTriangle size={12} /> Filter Conditions (optional)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
              {conds.map((c, i) => (
                <div key={i} className="card-inset" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--text-primary)', flex: 1 }}>
                    {c.field} <span style={{ color: 'var(--accent-400)' }}>{c.operator}</span> <span style={{ color: 'var(--green-400)' }}>{c.value}</span>
                  </span>
                  <button type="button" className="btn btn-icon" style={{ width: 24, height: 24 }} onClick={() => removeCond(i)}>
                    <XCircle size={11} style={{ color: 'var(--red-400)' }} />
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr auto', gap: 8, alignItems: 'flex-end' }}>
              <Input placeholder="field.path" value={cf} onChange={e => setCf(e.target.value)} />
              <Select options={OPERATOR_OPTS} value={cop} onChange={e => setCop(e.target.value as any)} />
              <Input placeholder="value" value={cv} onChange={e => setCv(e.target.value)} />
              <Btn type="button" variant="secondary" size="sm" icon={Plus} onClick={addCond}>Add</Btn>
            </div>
          </div>

          {/* Actions */}
          <div className="form-section">
            <div className="form-section-title" style={{ color: 'var(--green-400)' }}>
              <Plus size={12} /> Action Steps *
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              {acts.map((a, i) => (
                <div key={i} className="card-inset" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="t-label" style={{ padding: '1px 6px', borderRadius: 4, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>step {i+1}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)' }}>{a.actionType}</span>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--text-tertiary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.config?.url || a.config?.to || ''}
                  </span>
                  <button type="button" className="btn btn-icon" style={{ width: 24, height: 24 }} onClick={() => removeAct(i)}>
                    <Trash2 size={11} style={{ color: 'var(--red-400)' }} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '14px 0 0', borderTop: '1px solid var(--border-subtle)' }}>
              <Select label="Action Type" options={ACTION_TYPE_OPTS} value={at} onChange={e => setAt(e.target.value as any)} />

              {at === 'http_call' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 14px', background: 'var(--bg-canvas)', borderRadius: 8, borderLeft: '2px solid var(--green-500)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                    <Input label="URL" value={aUrl} onChange={e => setAUrl(e.target.value)} placeholder="https://api.example.com/…" />
                    <Select label="Method" options={METHOD_OPTS} value={aMeth} onChange={e => setAMeth(e.target.value)} style={{ minWidth: 100 }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <Textarea label="Headers JSON" value={aHdr} onChange={e => setAHdr(e.target.value)} style={{ minHeight: 60 }} />
                    <Textarea label="Body JSON" value={aBody} onChange={e => setABody(e.target.value)} style={{ minHeight: 60 }} />
                  </div>
                </div>
              )}

              {at === 'email_send' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 14px', background: 'var(--bg-canvas)', borderRadius: 8, borderLeft: '2px solid var(--green-500)' }}>
                  <Input label="To" value={aEmail} onChange={e => setAEmail(e.target.value)} placeholder="user@example.com" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <Input label="Subject" value={aSubj} onChange={e => setASubj(e.target.value)} />
                    <Input label="Body" value={aEBody} onChange={e => setAEBody(e.target.value)} />
                  </div>
                </div>
              )}

              {(at === 'slack_notify' || at === 'db_operation') && (
                <p className="form-hint" style={{ paddingLeft: 2 }}>
                  This is a mock action type — no configuration required. It will simulate execution in the pipeline.
                </p>
              )}

              <Btn type="button" variant="secondary" size="sm" icon={Plus} onClick={addAct} style={{ alignSelf: 'flex-start' }}>
                Add Action Step
              </Btn>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RulesView;
