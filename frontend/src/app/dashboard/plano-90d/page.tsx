'use client';
import { useEffect, useState } from 'react';
import { api, getClinicId } from '@/lib/api';

export default function Plano90dPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function reload() {
    const cid = getClinicId();
    if (!cid) return;
    const list = await api.listPlans(cid);
    setPlans(list);
    if (list[0]) setSelected(list[0]);
  }

  useEffect(() => {
    reload();
  }, []);

  async function generate() {
    const cid = getClinicId();
    if (!cid) return;
    setLoading(true);
    try {
      const p = await api.generatePlan(cid);
      setPlans([p, ...plans]);
      setSelected(p);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Plano de 90 dias</h1>
          <p className="text-slate-500">
            Roadmap semanal para 3x o faturamento, com orçamento e KPIs.
          </p>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="rounded-lg bg-primary px-4 py-2 text-white font-medium disabled:opacity-50"
        >
          {loading ? 'Gerando...' : 'Gerar novo plano'}
        </button>
      </header>

      {selected && (
        <section className="bg-white rounded-xl border p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-lg">{selected.title}</h2>
            <p className="text-sm text-slate-500">
              Orçamento sugerido:{' '}
              <strong>
                R$ {selected.budget?.toLocaleString?.('pt-BR') ?? selected.budget}
              </strong>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">KPIs projetados</h3>
              <ul className="text-sm text-slate-700 space-y-1">
                {Object.entries(selected.kpis || {}).map(([k, v]: any) => (
                  <li key={k}>
                    <strong>{k}:</strong> {v}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">Recomendações-chave</h3>
              <ul className="text-sm text-slate-700 list-disc pl-5 space-y-1">
                {(selected.recommendations || []).map((r: string, i: number) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Tarefas semanais</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="p-2">Semana</th>
                    <th className="p-2">Foco</th>
                    <th className="p-2">Tarefas</th>
                  </tr>
                </thead>
                <tbody>
                  {(selected.weeks || []).map((w: any, i: number) => (
                    <tr key={i} className="border-t">
                      <td className="p-2 font-medium">S{w.week}</td>
                      <td className="p-2">{w.focus}</td>
                      <td className="p-2">
                        <ul className="list-disc pl-4 space-y-0.5">
                          {w.tasks.map((t: string, k: number) => (
                            <li key={k}>{t}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {plans.length > 1 && (
        <section>
          <h3 className="font-medium mb-2">Histórico</h3>
          <div className="flex flex-wrap gap-2">
            {plans.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                className={`rounded-lg border px-3 py-1 text-sm ${
                  selected?.id === p.id
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white'
                }`}
              >
                {new Date(p.createdAt).toLocaleDateString('pt-BR')}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
