'use client';
import { useEffect, useState } from 'react';
import { api, getClinicId } from '@/lib/api';
import { Button, Card, CardTitle, Input, Label, Badge } from '@/components/ui';

export default function DiagnosticoPage() {
  const [specialty, setSpecialty] = useState('Dermatologia');
  const [city, setCity] = useState('Florianópolis');
  const [district, setDistrict] = useState('Centro');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [list, setList] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function refresh() {
    const cid = getClinicId();
    if (!cid) return;
    const items = await api.listDiagnoses(cid);
    setList(items);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onRun(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const r = await api.createDiagnosis({ specialty, city, district });
      setResult(r);
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
        <h1 className="text-2xl font-bold">Diagnóstico IA de Concorrentes</h1>
        <p className="text-slate-500">
          Informe especialidade + cidade e receba análise completa.
        </p>
      </div>

      <Card>
        <form onSubmit={onRun} className="grid gap-4 md:grid-cols-4">
          <div>
            <Label>Especialidade</Label>
            <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} required />
          </div>
          <div>
            <Label>Cidade</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} required />
          </div>
          <div>
            <Label>Bairro (opcional)</Label>
            <Input value={district} onChange={(e) => setDistrict(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Analisando...' : 'Analisar mercado'}
            </Button>
          </div>
        </form>
        {err && <p className="mt-4 text-sm text-red-600">{err}</p>}
      </Card>

      {result && (
        <Card>
          <div className="flex items-center justify-between">
            <CardTitle>Resultado — {result.specialty} em {result.city}</CardTitle>
            <Badge variant="success">Score {result.score}/100</Badge>
          </div>
          <p className="mt-3 text-sm text-slate-600">{result.summary}</p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold text-sm">Fraquezas do mercado</h4>
              <ul className="mt-2 space-y-1 text-sm text-slate-600 list-disc pl-5">
                {(result.weaknesses ?? []).map((w: string, i: number) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm">Plano de ataque (90d)</h4>
              <div className="mt-2 space-y-3 text-sm">
                {Object.entries(result.attackPlan ?? {}).map(([pillar, items]) => (
                  <div key={pillar}>
                    <div className="font-semibold capitalize">{pillar}</div>
                    <ul className="list-disc pl-5 text-slate-600">
                      {(items as string[]).map((it, i) => (
                        <li key={i}>{it}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="font-semibold text-sm mb-2">Top concorrentes</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-slate-500">
                  <tr>
                    <th className="py-1">#</th>
                    <th>Nome</th>
                    <th>Posicionamento</th>
                    <th>SEO</th>
                    <th>Ads Meta</th>
                    <th>Ads Google</th>
                    <th>Preço médio</th>
                  </tr>
                </thead>
                <tbody>
                  {(result.competitors ?? []).map((c: any) => (
                    <tr key={c.rank} className="border-t">
                      <td className="py-2">{c.rank}</td>
                      <td>{c.name}</td>
                      <td>{c.positioning}</td>
                      <td>{c.seoStrength}</td>
                      <td>{c.estimatedAdsMeta}</td>
                      <td>{c.estimatedAdsGoogle}</td>
                      <td>R$ {c.averagePrice}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <CardTitle>Diagnósticos anteriores</CardTitle>
        <div className="mt-4 space-y-2">
          {list.length === 0 && (
            <p className="text-sm text-slate-500">Nenhum ainda.</p>
          )}
          {list.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm"
            >
              <div>
                <div className="font-semibold">
                  {d.specialty} • {d.city}
                  {d.district ? ` / ${d.district}` : ''}
                </div>
                <div className="text-xs text-slate-500">
                  {new Date(d.createdAt).toLocaleString('pt-BR')}
                </div>
              </div>
              <Badge variant="info">Score {d.score}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
