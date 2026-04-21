'use client';
import { useEffect, useState } from 'react';
import { api, getClinicId } from '@/lib/api';

export default function FollowupsPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);

  async function reload() {
    const cid = getClinicId();
    if (!cid) return;
    setTemplates(await api.listTemplates());
    setJobs(await api.listJobs(cid));
  }

  useEffect(() => {
    reload();
  }, []);

  async function save() {
    if (!editing) return;
    await api.upsertTemplate(editing);
    setEditing(null);
    await reload();
  }

  async function cancel(id: string) {
    if (!confirm('Cancelar este envio?')) return;
    await api.cancelJob(id);
    await reload();
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Follow-ups automáticos</h1>
        <p className="text-slate-500">
          Sequências D0/D2/D5/D10 e mensagens pós-atendimento via WhatsApp.
        </p>
      </header>

      <section className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Templates</h2>
          <button
            onClick={() =>
              setEditing({
                code: '',
                name: '',
                channel: 'WHATSAPP',
                delayDays: 0,
                body: '',
                enabled: true,
              })
            }
            className="rounded-lg border px-3 py-1 text-sm hover:bg-slate-50"
          >
            + Novo template
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="p-2">Código</th>
              <th className="p-2">Nome</th>
              <th className="p-2">Canal</th>
              <th className="p-2">Atraso (dias)</th>
              <th className="p-2">Ativo</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="p-2 font-mono">{t.code}</td>
                <td className="p-2">{t.name}</td>
                <td className="p-2">{t.channel}</td>
                <td className="p-2">{t.delayDays}</td>
                <td className="p-2">{t.enabled ? 'Sim' : 'Não'}</td>
                <td className="p-2">
                  <button
                    onClick={() => setEditing({ ...t })}
                    className="text-xs text-primary"
                  >
                    editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {editing && (
        <section className="bg-white rounded-xl border p-6 space-y-3">
          <h3 className="font-semibold">
            {editing.id ? `Editar ${editing.code}` : 'Novo template'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="rounded-lg border px-3 py-2"
              placeholder="Código (ex: D0)"
              value={editing.code}
              onChange={(e) => setEditing({ ...editing, code: e.target.value })}
            />
            <input
              className="rounded-lg border px-3 py-2"
              placeholder="Nome"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            />
            <select
              className="rounded-lg border px-3 py-2"
              value={editing.channel}
              onChange={(e) =>
                setEditing({ ...editing, channel: e.target.value })
              }
            >
              <option value="WHATSAPP">WhatsApp</option>
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS</option>
            </select>
            <input
              type="number"
              className="rounded-lg border px-3 py-2"
              placeholder="Atraso em dias"
              value={editing.delayDays}
              onChange={(e) =>
                setEditing({ ...editing, delayDays: Number(e.target.value) })
              }
            />
          </div>
          <textarea
            className="w-full rounded-lg border px-3 py-2"
            rows={4}
            placeholder="Texto (pode usar {{nome}}, {{procedimento}}, {{clinica}})"
            value={editing.body}
            onChange={(e) => setEditing({ ...editing, body: e.target.value })}
          />
          <div className="flex gap-2">
            <button
              onClick={save}
              className="rounded-lg bg-primary px-4 py-2 text-white"
            >
              Salvar
            </button>
            <button
              onClick={() => setEditing(null)}
              className="rounded-lg border px-4 py-2"
            >
              Cancelar
            </button>
          </div>
        </section>
      )}

      <section className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold mb-3">Fila de envios</h2>
        {jobs.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum envio agendado.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="p-2">Quando</th>
                <th className="p-2">Lead</th>
                <th className="p-2">Template</th>
                <th className="p-2">Status</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id} className="border-t">
                  <td className="p-2">
                    {new Date(j.scheduledFor).toLocaleString('pt-BR')}
                  </td>
                  <td className="p-2">
                    {j.lead?.name}{' '}
                    <span className="text-xs text-slate-400">
                      {j.lead?.phone}
                    </span>
                  </td>
                  <td className="p-2 font-mono text-xs">{j.templateCode}</td>
                  <td className="p-2">
                    <span
                      className={
                        j.status === 'SENT'
                          ? 'text-green-700'
                          : j.status === 'FAILED'
                            ? 'text-red-700'
                            : 'text-slate-700'
                      }
                    >
                      {j.status}
                    </span>
                  </td>
                  <td className="p-2">
                    {j.status === 'PENDING' && (
                      <button
                        onClick={() => cancel(j.id)}
                        className="text-xs text-red-600"
                      >
                        cancelar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
