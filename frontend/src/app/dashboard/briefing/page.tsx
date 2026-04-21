'use client';
import { useEffect, useState } from 'react';
import { api, getClinicId } from '@/lib/api';
import {
  Button,
  Card,
  CardTitle,
  Input,
  Label,
  Textarea,
  Badge,
} from '@/components/ui';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function BriefingPage() {
  const [form, setForm] = useState({
    nomeMedico: 'Dr. João Silva',
    crm: 'CRM/SC 12345',
    nomeClinica: 'Clínica Pele Clara',
    telefone: '+55 48 99999-0000',
    whatsapp: '+55 48 99999-0000',
    email: 'contato@peleclara.com.br',
    instagram: '@drjoao',
    endereco: 'Rua das Flores, 123 - Centro',
    procedimentos: 'Botox, Preenchimento, Laser, Peeling',
    diferenciais: 'Tecnologia de ponta, Atendimento humanizado, Equipe especializada',
    tom: 'profissional, acolhedor',
    faturamentoMeta: 150000,
    publico: 'Mulheres 25–55, classe A/B, interesse em estética e autocuidado',
  });
  const [briefings, setBriefings] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [lastSite, setLastSite] = useState<any>(null);

  async function refresh() {
    const cid = getClinicId();
    if (!cid) return;
    const [bs, ss] = await Promise.all([
      api.listBriefings(cid),
      api.listSites(cid),
    ]);
    setBriefings(bs);
    setSites(ss);
  }

  useEffect(() => {
    refresh();
  }, []);

  function set<K extends keyof typeof form>(k: K, v: any) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const briefing = await api.createBriefing({
        doctor: {
          nomeMedico: form.nomeMedico,
          crm: form.crm,
          nomeClinica: form.nomeClinica,
          telefone: form.telefone,
          whatsapp: form.whatsapp,
          email: form.email,
          instagram: form.instagram,
          endereco: form.endereco,
        },
        services: {
          procedimentosPrincipais: form.procedimentos
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        },
        differentials: {
          diferenciais: form.diferenciais
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        },
        media: { fotos: [], videos: [], logo: '' },
        tone: { tomPrincipal: form.tom },
        goals: { faturamentoMeta90d: Number(form.faturamentoMeta) },
        audience: { descricao: form.publico },
      });
      const site = await api.generateSite(briefing.id);
      setLastSite(site);
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
        <h1 className="text-2xl font-bold">Briefing + Geração de Site</h1>
        <p className="text-slate-500">
          Preencha o briefing e gere um site otimizado em segundos.
        </p>
      </div>

      <Card>
        <form onSubmit={onSave} className="grid gap-4 md:grid-cols-2">
          <Field label="Médico" value={form.nomeMedico} on={(v) => set('nomeMedico', v)} />
          <Field label="CRM" value={form.crm} on={(v) => set('crm', v)} />
          <Field label="Clínica" value={form.nomeClinica} on={(v) => set('nomeClinica', v)} />
          <Field label="Telefone" value={form.telefone} on={(v) => set('telefone', v)} />
          <Field label="WhatsApp" value={form.whatsapp} on={(v) => set('whatsapp', v)} />
          <Field label="E-mail" value={form.email} on={(v) => set('email', v)} />
          <Field label="Instagram" value={form.instagram} on={(v) => set('instagram', v)} />
          <Field label="Endereço" value={form.endereco} on={(v) => set('endereco', v)} />
          <div className="md:col-span-2">
            <Label>Procedimentos principais (separados por vírgula)</Label>
            <Input value={form.procedimentos} onChange={(e) => set('procedimentos', e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label>Diferenciais competitivos</Label>
            <Input value={form.diferenciais} onChange={(e) => set('diferenciais', e.target.value)} />
          </div>
          <Field label="Tom de voz" value={form.tom} on={(v) => set('tom', v)} />
          <Field
            label="Meta de faturamento 90d (R$)"
            value={String(form.faturamentoMeta)}
            on={(v) => set('faturamentoMeta', Number(v))}
            type="number"
          />
          <div className="md:col-span-2">
            <Label>Público-alvo</Label>
            <Textarea
              rows={3}
              value={form.publico}
              onChange={(e) => set('publico', e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? 'Gerando site...' : 'Salvar briefing e gerar site'}
            </Button>
          </div>
        </form>
        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
      </Card>

      {lastSite && (
        <Card>
          <div className="flex items-center justify-between">
            <CardTitle>Site gerado</CardTitle>
            <a
              className="text-primary font-semibold text-sm"
              href={`${API}/sites/${lastSite.id}/preview`}
              target="_blank"
              rel="noopener"
            >
              Abrir preview ↗
            </a>
          </div>
          <iframe
            className="mt-4 w-full h-[600px] border rounded-lg"
            src={`${API}/sites/${lastSite.id}/preview`}
          />
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardTitle>Briefings salvos</CardTitle>
          <div className="mt-3 space-y-2 text-sm">
            {briefings.length === 0 && <p className="text-slate-500">Nenhum.</p>}
            {briefings.map((b) => (
              <div key={b.id} className="rounded border border-slate-200 p-3">
                <div className="font-semibold">
                  {(b.doctor as any)?.nomeClinica ?? 'Clínica'}
                </div>
                <div className="text-xs text-slate-500">
                  {new Date(b.createdAt).toLocaleString('pt-BR')}
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardTitle>Sites gerados</CardTitle>
          <div className="mt-3 space-y-2 text-sm">
            {sites.length === 0 && <p className="text-slate-500">Nenhum.</p>}
            {sites.map((s) => (
              <div
                key={s.id}
                className="rounded border border-slate-200 p-3 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold">{s.slug}</div>
                  <div className="text-xs text-slate-500">
                    {new Date(s.createdAt).toLocaleString('pt-BR')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={s.status === 'PUBLISHED' ? 'success' : 'default'}>
                    {s.status}
                  </Badge>
                  <a
                    href={`${API}/sites/${s.id}/preview`}
                    target="_blank"
                    rel="noopener"
                    className="text-primary font-semibold"
                  >
                    Preview ↗
                  </a>
                  {s.status !== 'PUBLISHED' && (
                    <button
                      onClick={async () => {
                        await api.publishSite(s.id);
                        refresh();
                      }}
                      className="text-xs rounded border px-2 py-0.5 hover:bg-slate-50"
                    >
                      Publicar
                    </button>
                  )}
                  <a
                    href={api.siteExportUrl(s.id)}
                    className="text-xs rounded border px-2 py-0.5 hover:bg-slate-50"
                  >
                    ZIP
                  </a>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  on,
  type = 'text',
}: {
  label: string;
  value: string;
  on: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input value={value} type={type} onChange={(e) => on(e.target.value)} />
    </div>
  );
}
