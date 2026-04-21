'use client';
import { useCallback, useEffect, useState } from 'react';
import { api, getClinicId } from '@/lib/api';
import {
  Button,
  Card,
  CardTitle,
  Input,
  Label,
  Badge,
} from '@/components/ui';
import { brl } from '@/lib/utils';

const STAGES = [
  { key: 'NEW', label: 'Novo' },
  { key: 'QUALIFIED', label: 'Qualificado' },
  { key: 'SCHEDULED', label: 'Agendado' },
  { key: 'ATTENDED', label: 'Compareceu' },
  { key: 'RECURRING', label: 'Recorrente' },
  { key: 'LOST', label: 'Perdido' },
];

export default function CrmPage() {
  const [board, setBoard] = useState<Record<string, any[]>>({});
  const [pending, setPending] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);

  // novo lead
  const [newLead, setNewLead] = useState({
    name: '',
    phone: '',
    procedure: '',
    value: 0,
    source: 'meta',
  });

  const refresh = useCallback(async () => {
    const cid = getClinicId();
    if (!cid) return;
    try {
      const [b, p] = await Promise.all([
        api.board(cid),
        api.pendingFollowups(cid),
      ]);
      setBoard(b);
      setPending(p);
    } catch (e: any) {
      setErr(e.message);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.createLead({
        ...newLead,
        value: Number(newLead.value) || undefined,
      });
      setNewLead({ name: '', phone: '', procedure: '', value: 0, source: 'meta' });
      refresh();
    } catch (e: any) {
      setErr(e.message);
    }
  }

  async function move(id: string, stage: string) {
    try {
      await api.moveLead(id, stage);
      refresh();
    } catch (e: any) {
      setErr(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">CRM — Funil de Leads</h1>
        <p className="text-slate-500">
          Mova os cards entre estágios para atualizar o status.
        </p>
      </div>

      <Card>
        <CardTitle>Novo lead</CardTitle>
        <form onSubmit={onCreate} className="mt-4 grid gap-3 md:grid-cols-6">
          <div className="md:col-span-2">
            <Label>Nome</Label>
            <Input
              required
              value={newLead.name}
              onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
            />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input
              required
              value={newLead.phone}
              onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
            />
          </div>
          <div>
            <Label>Procedimento</Label>
            <Input
              value={newLead.procedure}
              onChange={(e) =>
                setNewLead({ ...newLead, procedure: e.target.value })
              }
            />
          </div>
          <div>
            <Label>Valor (R$)</Label>
            <Input
              type="number"
              value={newLead.value}
              onChange={(e) =>
                setNewLead({ ...newLead, value: Number(e.target.value) })
              }
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full">
              Adicionar
            </Button>
          </div>
        </form>
        {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
      </Card>

      <div className="grid gap-3 grid-cols-1 md:grid-cols-3 lg:grid-cols-6">
        {STAGES.map((s) => (
          <div key={s.key} className="bg-white rounded-xl border border-slate-200 p-3 min-h-[300px]">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-sm">{s.label}</div>
              <Badge>{(board[s.key] ?? []).length}</Badge>
            </div>
            <div className="space-y-2">
              {(board[s.key] ?? []).map((l) => (
                <LeadCard key={l.id} lead={l} move={move} />
              ))}
              {(board[s.key] ?? []).length === 0 && (
                <div className="text-xs text-slate-400">vazio</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Card>
        <CardTitle>Follow-ups pendentes</CardTitle>
        <p className="text-sm text-slate-500 mt-1">
          Templates automáticos (Dia 0/2/5/10) ainda não enviados.
        </p>
        <div className="mt-4 space-y-2 text-sm">
          {pending.length === 0 && (
            <p className="text-slate-400">Tudo em dia 🎉</p>
          )}
          {pending.map((p) => (
            <div
              key={`${p.leadId}-${p.step}`}
              className="flex items-center justify-between rounded border border-slate-200 p-2"
            >
              <div>
                <span className="font-semibold">{p.leadName}</span>{' '}
                <span className="text-slate-500">({p.phone})</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="warning">{p.step}</Badge>
                <span className="text-xs text-slate-500">{p.template}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function LeadCard({
  lead,
  move,
}: {
  lead: any;
  move: (id: string, stage: string) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-3 text-sm bg-slate-50">
      <div className="font-semibold">{lead.name}</div>
      <div className="text-xs text-slate-500">{lead.phone}</div>
      {lead.procedure && (
        <div className="mt-1 text-xs">
          {lead.procedure}
          {lead.value ? ` • ${brl(lead.value)}` : ''}
        </div>
      )}
      <select
        className="mt-2 w-full text-xs rounded border border-slate-300 p-1"
        value={lead.stage}
        onChange={(e) => move(lead.id, e.target.value)}
      >
        {['NEW', 'QUALIFIED', 'SCHEDULED', 'ATTENDED', 'RECURRING', 'LOST'].map(
          (s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ),
        )}
      </select>
    </div>
  );
}
