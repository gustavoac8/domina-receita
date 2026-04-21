'use client';
import { useEffect, useState } from 'react';
import { api, getClinicId } from '@/lib/api';

export default function SeoPage() {
  const [audit, setAudit] = useState<any>(null);
  const [url, setUrl] = useState('');
  const [seed, setSeed] = useState('harmonização facial são paulo');
  const [keywords, setKeywords] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState('');

  async function reload() {
    const cid = getClinicId();
    if (!cid) return;
    setArticles(await api.listArticles(cid));
  }

  useEffect(() => {
    reload();
  }, []);

  async function runAudit() {
    if (!url) return;
    setLoading('audit');
    try {
      setAudit(await api.seoAudit(url));
    } finally {
      setLoading('');
    }
  }

  async function runKeywords() {
    setLoading('kw');
    try {
      const r = await api.seoKeywords(seed, 'BR');
      setKeywords(r.ideas ?? r ?? []);
    } finally {
      setLoading('');
    }
  }

  async function generate(keyword: string) {
    const cid = getClinicId();
    if (!cid) return;
    setLoading('art:' + keyword);
    try {
      await api.seoGenerateArticle(cid, keyword);
      await reload();
    } finally {
      setLoading('');
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">SEO & Conteúdo</h1>
        <p className="text-slate-500">
          Auditoria, sugestão de palavras-chave e geração de artigos com IA.
        </p>
      </header>

      <section className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold mb-3">Auditoria SEO de uma página</h2>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border px-3 py-2"
            placeholder="https://www.suaclinica.com.br"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            onClick={runAudit}
            disabled={loading === 'audit'}
            className="rounded-lg bg-primary px-4 py-2 text-white disabled:opacity-50"
          >
            {loading === 'audit' ? 'Auditando...' : 'Auditar'}
          </button>
        </div>
        {audit && (
          <div className="mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-24 bg-slate-200 rounded-full overflow-hidden"
                title={`${audit.score}/100`}
              >
                <div
                  className="h-full bg-green-500"
                  style={{ width: `${audit.score}%` }}
                />
              </div>
              <strong>Score: {audit.score}/100</strong>
            </div>
            <ul className="mt-3 list-disc pl-5 space-y-1">
              {(audit.checks ?? []).map((c: any, i: number) => (
                <li key={i}>
                  <span
                    className={
                      c.pass ? 'text-green-700' : 'text-red-700 font-medium'
                    }
                  >
                    {c.pass ? '✓' : '✗'}
                  </span>{' '}
                  {c.label}
                  {c.hint && (
                    <span className="text-slate-500"> — {c.hint}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold mb-3">Ideias de palavras-chave</h2>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border px-3 py-2"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
          />
          <button
            onClick={runKeywords}
            disabled={loading === 'kw'}
            className="rounded-lg bg-primary px-4 py-2 text-white disabled:opacity-50"
          >
            Buscar
          </button>
        </div>
        {keywords.length > 0 && (
          <table className="w-full text-sm mt-4">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="p-2">Palavra-chave</th>
                <th className="p-2">Volume</th>
                <th className="p-2">CPC</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {keywords.map((k: any, i: number) => (
                <tr key={i} className="border-t">
                  <td className="p-2">{k.keyword}</td>
                  <td className="p-2">{k.volume}</td>
                  <td className="p-2">
                    R$ {Number(k.cpc ?? 0).toFixed(2)}
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() => generate(k.keyword)}
                      disabled={loading === 'art:' + k.keyword}
                      className="rounded-lg border px-2 py-1 text-xs hover:bg-slate-50"
                    >
                      {loading === 'art:' + k.keyword
                        ? 'Gerando...'
                        : 'Gerar artigo'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold mb-3">Artigos gerados</h2>
        {articles.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum artigo ainda.</p>
        ) : (
          <ul className="space-y-2">
            {articles.map((a) => (
              <li key={a.id} className="border rounded-lg p-3">
                <div className="font-medium">{a.title}</div>
                <div className="text-xs text-slate-500">
                  Palavra-chave: {a.keyword} ·{' '}
                  {new Date(a.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
