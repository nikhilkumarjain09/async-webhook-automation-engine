import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Sliders, AlertCircle, Trash2 } from 'lucide-react';
import { apiClient } from '../api/client';
import type { AutomationRule, RuleCondition, RuleAction } from '../types';
import {
  PageHeader, WorkflowCard, EmptyState, Select, Input, Textarea,
  Btn, Modal, JsonViewer, PaginationBar, SkeletonCard,
} from '../components/UI';

const STATUS_OPTIONS = [
  { value: '',         label: 'All rules' },
  { value: 'active',   label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const OPERATOR_OPTIONS = [
  { value: 'equals',      label: 'equals' },
  { value: 'contains',    label: 'contains' },
  { value: 'greaterThan', label: 'greater than' },
];

const ACTION_TYPE_OPTIONS = [
  { value: 'http_call',    label: 'HTTP Webhook Call' },
  { value: 'email_send',   label: 'Email (mock)' },
  { value: 'slack_notify', label: 'Slack (mock)' },
  { value: 'db_operation', label: 'DB Operation (mock)' },
];

const METHOD_OPTIONS = [
  { value: 'POST',  label: 'POST' },
  { value: 'GET',   label: 'GET' },
  { value: 'PUT',   label: 'PUT' },
  { value: 'PATCH', label: 'PATCH' },
];

export const RulesView: React.FC = () => {
  const qc = useQueryClient();
  const [page, setPage]       = useState(1);
  const LIMIT                 = 10;
  const [status, setStatus]   = useState('');
  const [viewRule, setViewRule]   = useState<AutomationRule | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // ── Form state ──────────────────────────────────────────────────────────
  const [fName, setFName]       = useState('');
  const [fDesc, setFDesc]       = useState('');
  const [fSource, setFSource]   = useState('');
  const [fEvent, setFEvent]     = useState('');
  const [conditions, setConds]  = useState<RuleCondition[]>([]);
  const [actions, setActions]   = useState<RuleAction[]>([]);

  // Temp condition row
  const [cField, setCField]     = useState('');
  const [cOp, setCOp]           = useState<RuleCondition['operator']>('equals');
  const [cVal, setCVal]         = useState('');

  // Temp action row
  const [aType, setAType]       = useState<RuleAction['actionType']>('http_call');
  const [aUrl, setAUrl]         = useState('');
  const [aMethod, setAMethod]   = useState('POST');
  const [aHeaders, setAHeaders] = useState('{}');
  const [aBody, setABody]       = useState('{}');
  const [aEmailTo, setAEmailTo] = useState('');
  const [aEmailSub, setAEmailSub] = useState('');
  const [aEmailBody, setAEmailBody] = useState('');

  const resetForm = () => {
    setFName(''); setFDesc(''); setFSource(''); setFEvent('');
    setConds([]); setActions([]);
    setCField(''); setCVal('');
    setAUrl(''); setAEmailTo(''); setAEmailSub(''); setAEmailBody('');
  };

  // ── Queries ─────────────────────────────────────────────────────────────
  const { data: rules, isLoading, isError } = useQuery<AutomationRule[]>({
    queryKey: ['rules', page, status],
    queryFn: async () => (await apiClient.get('/rules', { params: { page, limit: LIMIT, status: status || undefined } })).data,
  });

  const createMut = useMutation({
    mutationFn: async (dto: any) => (await apiClient.post('/rules', dto)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rules'] });
      setCreateOpen(false);
      resetForm();
    },
    onError: (err: any) => alert(`Create failed: ${err.response?.data?.message ?? err.message}`),
  });

  // ── Handlers ────────────────────────────────────────────────────────────
  const addCond = () => {
    if (!cField || !cVal) return;
    setConds(prev => [...prev, { field: cField, operator: cOp, value: cVal }]);
    setCField(''); setCVal('');
  };
  const removeCond = (i: number) => setConds(prev => prev.filter((_, j) => j !== i));

  const addAction = () => {
    let config: Record<string, any> = {};
    if (aType === 'http_call') {
      try {
        config = { url: aUrl, method: aMethod, headers: JSON.parse(aHeaders), body: JSON.parse(aBody) };
      } catch { alert('Invalid JSON in headers or body'); return; }
    } else if (aType === 'email_send') {
      config = { to: aEmailTo, subject: aEmailSub, body: aEmailBody };
    } else {
      config = { note: 'Mock action' };
    }
    setActions(prev => [...prev, { order: prev.length, actionType: aType, config }]);
    setAUrl(''); setAEmailTo(''); setAEmailSub(''); setAEmailBody('');
  };
  const removeAction = (i: number) =>
    setActions(prev => prev.filter((_, j) => j !== i).map((a, j) => ({ ...a, order: j })));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fName || !fSource || !fEvent) { alert('Name, trigger source and event type are required'); return; }
    if (actions.length === 0) { alert('Add at least one action'); return; }
    createMut.mutate({ name: fName, description: fDesc, triggerSource: fSource, triggerEventType: fEvent, status: 'active', conditions, actions });
  };

  // Build WorkflowCard steps from rule data
  const buildSteps = (rule: AutomationRule) => {
    const steps: any[] = [
      { type: 'trigger', label: `${rule.triggerSource}: ${rule.triggerEventType}` },
      ...rule.conditions.map(c => ({ type: 'condition', label: `${c.field} ${c.operator} ${c.value}` })),
      ...rule.actions.map(a => ({ type: 'action', label: a.actionType.replace('_', ' ').toUpperCase(), sub: a.config?.url || a.config?.to || '' })),
    ];
    return steps;
  };

  return (
    <div>
      <PageHeader
        title="Automation Rules"
        description="Define triggers, conditions, and action pipelines."
        action={
          <div className="flex items-center gap-2">
            <Select options={STATUS_OPTIONS} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} />
            <Btn variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus size={14} /> New Rule
            </Btn>
          </div>
        }
      />

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {isLoading && [1,2,3,4].map(n => <SkeletonCard key={n} />)}

        {isError && (
          <div className="col-span-full">
            <EmptyState icon={AlertCircle} title="Failed to load rules" description="Check your connection and tenant ID." />
          </div>
        )}

        {!isLoading && !isError && (!rules || rules.length === 0) && (
          <div className="col-span-full">
            <EmptyState
              icon={Sliders}
              title="No automation rules"
              description="Create your first rule to start routing webhook events to actions."
              action={<Btn variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} /> New Rule</Btn>}
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
            onConfigure={() => setViewRule(rule)}
          />
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-4 card" style={{ background: 'var(--bg-surface)' }}>
        <PaginationBar
          page={page}
          hasNext={Boolean(rules && rules.length === LIMIT)}
          onPrev={() => setPage(p => Math.max(p - 1, 1))}
          onNext={() => { if (rules && rules.length === LIMIT) setPage(p => p + 1); }}
        />
      </div>

      {/* ── View Rule Detail Modal ──────────────────────────────────────── */}
      <Modal
        open={!!viewRule}
        onClose={() => setViewRule(null)}
        title={viewRule?.name ?? ''}
        subtitle="Rule configuration parameters"
        size="lg"
        footer={<Btn variant="ghost" onClick={() => setViewRule(null)}>Close</Btn>}
      >
        {viewRule && (
          <div className="space-y-6">
            {/* Meta */}
            <div className="grid grid-cols-2 gap-4 rounded-xl p-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <div><p className="label mb-1">Trigger Source</p><p className="mono text-slate-200">{viewRule.triggerSource}</p></div>
              <div><p className="label mb-1">Event Type</p><p className="mono text-indigo-300">{viewRule.triggerEventType}</p></div>
              <div><p className="label mb-1">Status</p><span className={`badge badge-${viewRule.status}`}>{viewRule.status}</span></div>
              <div><p className="label mb-1">Created</p><p className="text-xs text-slate-400">{new Date(viewRule.createdAt).toLocaleDateString()}</p></div>
            </div>

            {/* Conditions */}
            <div>
              <p className="label mb-3">Filter Conditions ({viewRule.conditions.length})</p>
              {viewRule.conditions.length === 0 ? (
                <p className="body-sm italic">No conditions — fires on every matching event.</p>
              ) : (
                <div className="space-y-2">
                  {viewRule.conditions.map((c, i) => (
                    <div key={i} className="wf-step flex items-center gap-2.5 text-xs">
                      <span className="mono text-slate-300 font-semibold">{c.field}</span>
                      <span className="badge badge-processing">{c.operator}</span>
                      <span className="mono text-green-300">{c.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div>
              <p className="label mb-3">Action Steps ({viewRule.actions.length})</p>
              <div className="space-y-3">
                {viewRule.actions.map((a, i) => (
                  <div key={i} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                    <div className="px-4 py-3 flex items-center gap-3" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                      <span className="label px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>step {i + 1}</span>
                      <span className="text-xs font-semibold text-white uppercase tracking-wide">{a.actionType}</span>
                    </div>
                    <div className="p-3" style={{ background: 'var(--bg-base)' }}>
                      <JsonViewer data={a.config} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Create Rule Modal ───────────────────────────────────────────── */}
      <Modal
        open={createOpen}
        onClose={() => { setCreateOpen(false); resetForm(); }}
        title="Create Automation Rule"
        subtitle="Define a trigger, optional conditions, and a sequence of actions."
        size="xl"
        footer={
          <>
            <Btn variant="ghost" onClick={() => { setCreateOpen(false); resetForm(); }}>Cancel</Btn>
            <Btn variant="primary" onClick={handleSubmit} loading={createMut.isPending}>Save Rule</Btn>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Rule Name *" value={fName} onChange={e => setFName(e.target.value)} placeholder="e.g. Stripe → Slack" required />
            <Input label="Description" value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="What does this rule do?" />
          </div>

          {/* Trigger */}
          <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <p className="label" style={{ color: '#818cf8' }}>Trigger</p>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Source *" value={fSource} onChange={e => setFSource(e.target.value)} placeholder="stripe, github…" required />
              <Input label="Event Type *" value={fEvent} onChange={e => setFEvent(e.target.value)} placeholder="payment_intent.succeeded" required />
            </div>
          </div>

          {/* Conditions */}
          <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <p className="label" style={{ color: '#fbbf24' }}>Filter Conditions</p>
            {conditions.map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-xs rounded-lg p-2.5" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                <span className="mono text-slate-300 flex-1">{c.field} <span className="text-indigo-400">{c.operator}</span> <span className="text-green-400">{c.value}</span></span>
                <button type="button" onClick={() => removeCond(i)} className="btn-icon" style={{ width: 24, height: 24 }}>
                  <Trash2 size={11} className="text-red-400" />
                </button>
              </div>
            ))}
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="field.path" value={cField} onChange={e => setCField(e.target.value)} />
              <Select options={OPERATOR_OPTIONS} value={cOp} onChange={e => setCOp(e.target.value as any)} />
              <Input placeholder="value" value={cVal} onChange={e => setCVal(e.target.value)} />
            </div>
            <Btn type="button" variant="ghost" onClick={addCond} style={{ fontSize: '0.75rem', padding: '5px 10px' }}>
              + Add Condition
            </Btn>
          </div>

          {/* Actions */}
          <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <p className="label" style={{ color: '#4ade80' }}>Action Steps *</p>
            {actions.map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-xs rounded-lg p-2.5" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                <span className="label px-1 rounded" style={{ background: 'var(--bg-elevated)' }}>step {i+1}</span>
                <span className="font-semibold text-white uppercase">{a.actionType}</span>
                <span className="mono text-slate-500 flex-1 truncate">{a.config?.url || a.config?.to || ''}</span>
                <button type="button" onClick={() => removeAction(i)} className="btn-icon" style={{ width: 24, height: 24 }}>
                  <Trash2 size={11} className="text-red-400" />
                </button>
              </div>
            ))}

            <Select label="Action Type" options={ACTION_TYPE_OPTIONS} value={aType} onChange={e => setAType(e.target.value as any)} />

            {aType === 'http_call' && (
              <div className="space-y-2 pl-3 border-l-2" style={{ borderColor: '#4ade80' }}>
                <div className="grid grid-cols-3 gap-2">
                  <Input placeholder="https://…" value={aUrl} onChange={e => setAUrl(e.target.value)} className="col-span-2" />
                  <Select options={METHOD_OPTIONS} value={aMethod} onChange={e => setAMethod(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Textarea label="Headers JSON" value={aHeaders} onChange={e => setAHeaders(e.target.value)} rows={2} />
                  <Textarea label="Body JSON" value={aBody} onChange={e => setABody(e.target.value)} rows={2} />
                </div>
              </div>
            )}

            {aType === 'email_send' && (
              <div className="space-y-2 pl-3 border-l-2" style={{ borderColor: '#4ade80' }}>
                <Input label="To" placeholder="user@example.com" value={aEmailTo} onChange={e => setAEmailTo(e.target.value)} />
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Subject" value={aEmailSub} onChange={e => setAEmailSub(e.target.value)} />
                  <Input label="Body" value={aEmailBody} onChange={e => setAEmailBody(e.target.value)} />
                </div>
              </div>
            )}

            <Btn type="button" variant="ghost" onClick={addAction} style={{ fontSize: '0.75rem', padding: '5px 10px' }}>
              + Add Action
            </Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RulesView;
