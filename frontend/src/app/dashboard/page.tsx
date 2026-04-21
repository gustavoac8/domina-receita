'use client';
import { useEffect, useState } from 'react';
import { api, getClinicId } from '@/lib/api';
import { Card, CardTitle, Badge } from '@/components/ui';
import { brl } from '@/lib/utils';

export default function DashboardHome() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const cid = getClinicId();
    if (!cid) return;
    api
      .overview(cid)
      .then(setData)
      .catch((e) => setErr(e.message));
  }, []);

  if (err)
    return (
      <div>
        <h1 className="text-2xl font-bold">Visão geral</h1>
        <p className="mt-4 text-red-600">{err}</p>
      </div>
    );
  if (!data)
    return (
      <div>
        <h1 className="text-2xl font-bold">Visão geral</h1>
        <p className="mt-4 text-slate-500">Carregando métricas...</p>
      </div>
    );

  const k = data.kpis;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Visão geral</h1>
        <p className="text-slate-500">Dashboard de ROI em tempo real.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Kpi label="Leads totais" value={k.leadsTotal} />
        <Kpi label="Faturamento" value={brl(k.totalRevenue)} />
        <Kpi label="Gasto em ADS" value={brl(k.totalSpent)} />
        <Kpi label="ROAS" value={k.roas} suffix="x" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardTitle>Leads por estágio</CardTitle>
          <div className="mt-4 space-y-2">
            {Object.entries(k.leadsByStage).map(([stage, count]) => (
              <div
                key={stage}
                className="flex items-center justify-between text-sm"
              >
                <Badge>{stage}</Badge>
                <span className="font-semibold">{count as number}</span>
              </div>
            ))}
            {Object.keys(k.leadsByStage).length === 0 && (
              <p className="text-sm text-slate-500">Nenhum lead ainda.</p>
            )}
          </div>
        </Card>

        <Card>
          <CardTitle>Previsão de faturamento</CardTitle>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <Forecast label="30 dias" value={brl(data.forecast.revenue30d)} />
            <Forecast label="60 dias" value={brl(data.forecast.revenue60d)} />
            <Forecast label="90 dias" value={brl(data.forecast.revenue90d)} />
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Projeção linear baseada nos últimos 30 dias de pacientes atendidos.
          </p>
        </Card>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  suffix,
}: {
  label: string;
  value: any;
  suffix?: string;
}) {
  return (
    <Card>
      <div className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold">
        {value}
        {suffix}
      </div>
    </Card>
  );
}

function Forecast({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}
