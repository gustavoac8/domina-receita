'use client';
import { useEffect, useState } from 'react';
import { api, getClinicId } from '@/lib/api';

export default function IndicacoesPage() {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [form, setForm] = useState({
    referrerName: '',
    referrerPhone: '',
    rewardType: 'CASHBACK',
    rewardValue: 100,
  });

  async function reload() {
    const cid = getClinicId();
    if (!cid) return;
    const [list, s] = await Promise.all([
      api.listReferrals(cid),
      api.referralStats(cid),
    ]);
    setReferrals(list);
    setStats(s);
  }

  useEffect(() => {
    reload();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const cid = getClinicId();
    if (!cid) return;
    await api.generateReferralCode({ clinicId: cid, ...form });
    setForm({
      referrerName: '',
      referrerPhone: '',
      rewardType: 'CASHBACK',
      rewardValue: 100,
    });
    await reload();
  }

  async function pay(code: string) {
    const raw = prompt('Valor pago em R$:');
    const amount = Number(raw);
    if (!amount) return;
    await api.payReferralReward(code, amount);
    await reload();
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Indique-e-Ganhe</h1>
        <p className="text-slate-500">
          Gere códigos únicos, acompanhe indicações e pague recompensas.
        </p>
      </header>

      {stats && (
        <section className="bg-white rounded-xl border p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Metric label="Indicadores" value={stats.totalIndicadores} />
          <Metric label="Usos do código" value={stats.totalUsos} />
          <Metric
            label="Recompensas pagas"
            value={`R$ ${(stats.totalRecompensas ?? 0).toLocaleString('pt-BR')}`}
          />
          <Metric
            label="Taxa conversão"
            value={`${((stats.taxaConversao ?? 0) * 100).toFixed(0)}%`}
          />
        </section>
      )}

      <section className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold mb-3">Novo código de indicação</h2>
        <form
          onSubmit={create}
          className="grid grid-cols-1 md:grid-cols-4 gap-2"
        >
          <input
            required
            className="rounded-lg border px-3 py-2"
            placeholder="Nome do indicador"
            value={form.referrerName}
            onChange={(e) =>
              setForm({ ...form, referrerName: e.target.value })
            }
          />
          <input
            className="rounded-lg border px-3 py-2"
            placeholder="WhatsApp (opcional)"
            value={form.referrerPhone}
            onChange={(e) =>
              setForm({ ...form, referrerPhone: e.target.value })
            }
          />
          <select
            className="rounded-lg border px-3 py-2"
            value={form.rewardType}
            onChange={(e) => setForm({ ...form, rewardType: e.target.value })}
          >
            <option value="CASHBACK">Cashback</option>
            <option value="CREDITO">Crédito na clínica</option>
            <option value="DESCONTO">Desconto</option>
          </select>
          <input
            type="number"
            className="rounded-lg border px-3 py-2"
            placeholder="Valor R$"
            value={form.rewardValue}
            onChange={(e) =>
              setForm({ ...form, rewardValue: Number(e.target.value) })
            }
          />
          <button className="md:col-span-4 rounded-lg bg-primary px-4 py-2 text-white">
            Gerar código
          </button>
        </form>
      </section>

      <section className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold mb-3">Códigos ativos</h2>
        {referrals.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum código ainda.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="p-2">Código</th>
                <th className="p-2">Indicador</th>
                <th className="p-2">Recompensa</th>
                <th className="p-2">Usos</th>
                <th className="p-2">Pago</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2 font-mono">{r.code}</td>
                  <td className="p-2">
                    {r.referrerName}
                    <div className="text-xs text-slate-400">
                      {r.referrerPhone}
                    </div>
                  </td>
                  <td className="p-2">
                    {r.rewardType} · R${' '}
                    {Number(r.rewardValue ?? 0).toLocaleString('pt-BR')}
                  </td>
                  <td className="p-2">{r.usedCount}</td>
                  <td className="p-2">
                    R$ {Number(r.rewardsPaid ?? 0).toLocaleString('pt-BR')}
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() => pay(r.code)}
                      className="text-xs text-primary"
                    >
                      registrar pagamento
                    </button>
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

function Metric({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
