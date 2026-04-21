'use client';
import { useEffect, useState } from 'react';
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

const CHANNELS = ['META', 'GOOGLE', 'TIKTOK', 'YOUTUBE'];

export default function CampanhasPage() {
  const [list, setList] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: 'Botox — Centro',
    channel: 'META',
    objective: 'leads',
    dailyBudget: 100,
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function refresh() {
    const cid = getClinicId();
    if (!cid) return;
    const items = await api.listCampaigns(cid);
    setList(items);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      await api.createCampaign({
        name: form.name,
        channel: form.channel,
        objective: form.objective,
        dailyBudget: Number(form.dailyBudget),
      });
      refresh();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Campanhas de Tráfego</h1>
        <p className="text-slate-500">
          Crie uma campanha em 1 clique — copy e segmentação gerados pela IA.
        </p>
      </div>

      <Card>
        <CardTitle>Nova campanha</CardTitle>
        <form onSubmit={onCreate} className="mt-4 grid gap-3 md:grid-cols-5">
          <div className="md:col-span-2">
            <Label>Nome</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Canal</Label>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              value={form.channel}
              onChange={(e) => setForm({ ...form, channel: e.target.value })}
            >
              {CHANNELS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Objetivo</Label>
            <Input
              value={form.objective}
              onChange={(e) => setForm({ ...form, objective: e.target.value })}
            />
          </div>
          <div>
            <Label>Orçamento diário (R$)</Label>
            <Input
              type="number"
              value={form.dailyBudget}
              onChange={(e) =>
                setForm({ ...form, dailyBudget: Number(e.target.value) })
              }
            />
          </div>
          <div className="md:col-span-5">
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar campanha com IA'}
            </Button>
          </div>
        </form>
        {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {list.length === 0 && (
          <Card>
            <p className="text-sm text-slate-500">Nenhuma campanha ainda.</p>
          </Card>
        )}
        {list.map((c) => (
          <Card key={c.id}>
            <div className="flex items-center justify-between">
              <CardTitle>{c.name}</CardTitle>
              <Badge
                variant={
                  c.status === 'ACTIVE'
                    ? 'success'
                    : c.status === 'PAUSED'
                      ? 'warning'
                      : 'default'
                }
              >
                {c.status}
              </Badge>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {c.channel} • {c.objective} • orçamento diário {brl(c.dailyBudget)}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <Metric label="Gasto" value={brl(c.spent)} />
              <Metric label="Leads" value={c.leadsCount ?? 0} />
              <Metric label="Receita" value={brl(c.revenue)} />
            </div>

            {c.copy && (
              <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm space-y-1">
                <div>
                  <span className="font-semibold">Headline:</span> {c.copy.headline}
                </div>
                <div>
                  <span className="font-semibold">Body:</span> {c.copy.body}
                </div>
                <div>
                  <span className="font-semibold">CTA:</span> {c.copy.cta}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-lg border border-slate-200 p-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
