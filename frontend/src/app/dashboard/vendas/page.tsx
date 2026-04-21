'use client';
import { useEffect, useState } from 'react';
import { api, getClinicId } from '@/lib/api';

const STATUSES = ['SCHEDULED', 'ATTENDED', 'NO_SHOW', 'CANCELED'];

export default function VendasPage() {
  const [scripts, setScripts] = useState<any>(null);
  const [appts, setAppts] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    procedure: '',
    scheduledFor: '',
  });

  async function reload() {
    const cid = getClinicId();
    if (!cid) return;
    setAppts(await api.listAppointments(cid));
  }

  useEffect(() => {
    api.salesScripts().then(setScripts);
    reload();
  }, []);

  async function schedule(e: React.FormEvent) {
    e.preventDefault();
    await api.scheduleAppointment({ ...form, clinicId: getClinicId() });
    setForm({ name: '', phone: '', procedure: '', scheduledFor: '' });
    await reload();
  }

  async function updateStatus(id: string, status: string) {
    await api.updateAppointmentStatus(id, status);
    await reload();
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Vendas & Agendamento</h1>
        <p className="text-slate-500">
          Scripts prontos, novo agendamento e acompanhamento do funil.
        </p>
      </header>

      <section className="bg-white rounded-xl border p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="font-semibold mb-2">Scripts WhatsApp</h2>
          {(scripts?.whatsapp ?? []).map((s: any, i: number) => (
            <div key={i} className="mb-3">
              <div className="text-xs font-medium text-primary">
                {s.momento}
              </div>
              <div className="text-sm text-slate-700 whitespace-pre-line">
                {s.script}
              </div>
            </div>
          ))}
        </div>
        <div>
          <h2 className="font-semibold mb-2">Scripts Recepção</h2>
          {(scripts?.recepcao ?? []).map((s: any, i: number) => (
            <div key={i} className="mb-3">
              <div className="text-xs font-medium text-primary">
                {s.momento}
              </div>
              <div className="text-sm text-slate-700 whitespace-pre-line">
                {s.script}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold mb-3">Novo agendamento</h2>
        <form
          onSubmit={schedule}
          className="grid grid-cols-1 md:grid-cols-4 gap-2"
        >
          <input
            required
            className="rounded-lg border px-3 py-2"
            placeholder="Nome"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            required
            className="rounded-lg border px-3 py-2"
            placeholder="WhatsApp"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <input
            className="rounded-lg border px-3 py-2"
            placeholder="Procedimento"
            value={form.procedure}
            onChange={(e) => setForm({ ...form, procedure: e.target.value })}
          />
          <input
            required
            type="datetime-local"
            className="rounded-lg border px-3 py-2"
            value={form.scheduledFor}
            onChange={(e) =>
              setForm({ ...form, scheduledFor: e.target.value })
            }
          />
          <button className="md:col-span-4 rounded-lg bg-primary px-4 py-2 text-white">
            Agendar
          </button>
        </form>
      </section>

      <section className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold mb-3">Agendamentos</h2>
        {appts.length === 0 ? (
          <p className="text-sm text-slate-500">Sem agendamentos ainda.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="p-2">Data</th>
                <th className="p-2">Nome</th>
                <th className="p-2">Procedimento</th>
                <th className="p-2">Status</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {appts.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="p-2">
                    {new Date(a.scheduledFor).toLocaleString('pt-BR')}
                  </td>
                  <td className="p-2">
                    {a.name}{' '}
                    <span className="text-xs text-slate-400">{a.phone}</span>
                  </td>
                  <td className="p-2">{a.procedure ?? '-'}</td>
                  <td className="p-2">{a.status}</td>
                  <td className="p-2">
                    <select
                      className="border rounded px-1 py-0.5 text-xs"
                      value={a.status}
                      onChange={(e) => updateStatus(a.id, e.target.value)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
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
