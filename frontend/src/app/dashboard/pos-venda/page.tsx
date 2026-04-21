'use client';
import { useEffect, useState } from 'react';
import { api, getClinicId } from '@/lib/api';

export default function PosVendaPage() {
  const [reminders, setReminders] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [form, setForm] = useState({
    leadId: '',
    intervalMonths: 6,
    message: '',
  });

  async function reload() {
    const cid = getClinicId();
    if (!cid) return;
    const [a, b] = await Promise.all([
      api.listReminders(cid),
      api.annualCandidates(cid),
    ]);
    setReminders(a);
    setCandidates(b);
  }

  useEffect(() => {
    reload();
  }, []);

  async function enroll(e: React.FormEvent) {
    e.preventDefault();
    if (!form.leadId) return;
    await api.enrollReminder(form);
    setForm({ leadId: '', intervalMonths: 6, message: '' });
    await reload();
  }

  async function cancel(id: string) {
    if (!confirm('Cancelar este lembrete?')) return;
    await api.cancelReminder(id);
    await reload();
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Pós-venda & Retenção</h1>
        <p className="text-slate-500">
          Lembretes automáticos de retorno (6m, 12m) e upsell de pacotes
          anuais.
        </p>
      </header>

      <section className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold mb-3">Criar lembrete de retorno</h2>
        <form
          onSubmit={enroll}
          className="grid grid-cols-1 md:grid-cols-4 gap-2"
        >
          <input
            required
            className="rounded-lg border px-3 py-2"
            placeholder="ID do lead (ATTENDED)"
            value={form.leadId}
            onChange={(e) => setForm({ ...form, leadId: e.target.value })}
          />
          <select
            className="rounded-lg border px-3 py-2"
            value={form.intervalMonths}
            onChange={(e) =>
              setForm({ ...form, intervalMonths: Number(e.target.value) })
            }
          >
            <option value={3}>3 meses</option>
            <option value={6}>6 meses</option>
            <option value={12}>12 meses</option>
          </select>
          <input
            className="md:col-span-2 rounded-lg border px-3 py-2"
            placeholder="Mensagem customizada (opcional)"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
          <button className="md:col-span-4 rounded-lg bg-primary px-4 py-2 text-white">
            Agendar lembrete
          </button>
        </form>
      </section>

      <section className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold mb-3">Lembretes ativos</h2>
        {reminders.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum lembrete ativo.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="p-2">Próximo envio</th>
                <th className="p-2">Paciente</th>
                <th className="p-2">Intervalo</th>
                <th className="p-2">Status</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {reminders.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">
                    {new Date(r.nextDueAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-2">
                    {r.lead?.name}{' '}
                    <span className="text-xs text-slate-400">
                      {r.lead?.phone}
                    </span>
                  </td>
                  <td className="p-2">{r.intervalMonths} meses</td>
                  <td className="p-2">{r.status}</td>
                  <td className="p-2">
                    {r.status === 'PENDING' && (
                      <button
                        onClick={() => cancel(r.id)}
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

      <section className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold mb-3">Candidatos a pacote anual</h2>
        {candidates.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nenhum paciente elegível (ainda).
          </p>
        ) : (
          <ul className="space-y-2">
            {candidates.map((c) => (
              <li
                key={c.id}
                className="border rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-slate-500">
                    {c.phone} · {c.procedure ?? '—'}
                  </div>
                </div>
                <div className="text-sm text-right">
                  <div className="font-medium">{c.suggestedPackage?.name}</div>
                  <div className="text-xs text-slate-500">
                    R${' '}
                    {(
                      c.suggestedPackage?.price ?? 0
                    ).toLocaleString('pt-BR')}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
